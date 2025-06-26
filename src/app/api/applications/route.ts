import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for creator applications
const creatorApplicationSchema = z.object({
  type: z.literal("creator"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  website: z.string().optional(),
  experience: z.string().min(1, "Experience is required"),
  expertise: z.string().min(1, "Expertise is required"),
  description: z.string().min(10, "Description is required"),
  portfolio: z.string().optional(),
});

// Schema for developer applications
const developerApplicationSchema = z.object({
  type: z.literal("developer"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  github: z.string().min(1, "GitHub profile is required"),
  experience: z.string().min(1, "Experience is required"),
  expertise: z.string().min(1, "Expertise is required"),
  description: z.string().min(10, "Description is required"),
  portfolio: z.string().optional(),
  languages: z.string().min(1, "Programming languages are required"),
});

// Combined schema using discriminated union
const applicationSchema = z.discriminatedUnion("type", [
  creatorApplicationSchema,
  developerApplicationSchema,
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const validationResult = applicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Store the application in the database
    const application = await prisma.application.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        company: data.company || null,
        status: "pending",
        metadata: {
          ...(data.type === "creator" 
            ? {
                website: data.website,
                experience: data.experience,
                expertise: data.expertise,
                description: data.description,
                portfolio: data.portfolio,
              }
            : {
                github: data.github,
                experience: data.experience,
                expertise: data.expertise,
                description: data.description,
                portfolio: data.portfolio,
                languages: data.languages,
              }
          ),
        },
      },
    });
    
    // Send email notification (would be implemented in a production environment)
    // await sendNotificationEmail(data.email, data.name, data.type);
    
    return NextResponse.json({ 
      success: true, 
      message: "Application submitted successfully",
      applicationId: application.id
    });
    
  } catch (error) {
    console.error("Error processing application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process application" },
      { status: 500 }
    );
  }
}
