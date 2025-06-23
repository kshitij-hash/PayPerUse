import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PollyClient, SynthesizeSpeechCommand, LanguageCode, Engine, OutputFormat, TextType, VoiceId } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Promisify exec for easier usage
const execAsync = promisify(exec);

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

// Define temporary directory for file processing
const tempDir = path.join(os.tmpdir(), 'trailer-generator');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Agent 1: Script Summarizer
 * Uses Claude model to summarize a script into key scenes
 */
async function summarizeScript(script: string): Promise<string[]> {
  try {
    const prompt = `
      You are a professional script summarizer. Your task is to analyze the following script and break it down into 5-7 key scenes that would work well for a trailer.
      
      For each scene, provide a concise description that could be used to generate a visual representation. Focus on the most dramatic, visually interesting, or emotionally powerful moments.
      
      Format your response as a numbered list of scene descriptions, with each scene being 1-2 sentences long.
      
      SCRIPT:
      ${script}
    `;

    const params = {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    };

    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;

    // Extract the scenes from the response
    const scenes = content
      .split('\n')
      .filter((line: string) => /^\d+\./.test(line.trim()))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());

    return scenes;
  } catch (error) {
    console.error('Error in summarizeScript:', error);
    throw new Error(`Failed to summarize script: ${error}`);
  }
}

/**
 * Agent 2: Scene Art Creator
 * Uses Stable Diffusion model to generate images for each scene
 */
async function createSceneArt(scenes: string[]): Promise<string[]> {
  try {
    const imagePaths: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const prompt = `Create a cinematic, high-quality movie still for the following scene: ${scene}. Make it dramatic and visually striking, as if it's a frame from a professional film trailer.`;

      const params = {
        modelId: 'stability.stable-diffusion-xl-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1.0
            }
          ],
          cfg_scale: 7,
          steps: 50,
          seed: Math.floor(Math.random() * 1000000)
        })
      };

      const command = new InvokeModelCommand(params);
      const response = await bedrockClient.send(command);

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const base64Image = responseBody.artifacts[0].base64;

      // Save the image to a temporary file
      const imagePath = path.join(tempDir, `scene-${i + 1}.png`);
      fs.writeFileSync(imagePath, Buffer.from(base64Image, 'base64'));
      imagePaths.push(imagePath);
    }

    return imagePaths;
  } catch (error) {
    console.error('Error in createSceneArt:', error);
    throw new Error(`Failed to create scene art: ${error}`);
  }
}

/**
 * Agent 3: Trailer Voiceover Agent
 * Uses Amazon Polly to generate a voiceover for the trailer
 */
async function createVoiceover(scenes: string[]): Promise<string> {
  try {
    // Create a script for the voiceover
    const voiceoverScript = scenes.map((scene, index) => {
      // Add dramatic pauses between scenes
      return `${scene}${index < scenes.length - 1 ? '... ' : ''}`;
    }).join(' ');

    // Add dramatic intro and outro
    const fullScript = `In a world where anything is possible. ${voiceoverScript} Coming soon to theaters everywhere.`;

    const params = {
      Engine: 'neural' as Engine,
      LanguageCode: 'en-US' as LanguageCode,
      OutputFormat: 'mp3' as OutputFormat,
      SampleRate: '24000',
      Text: fullScript,
      TextType: 'text' as TextType,
      VoiceId: 'Matthew' as VoiceId // Deep male voice typical for movie trailers
    };

    const command = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(command);

    // Save the audio to a temporary file
    const audioPath = path.join(tempDir, 'voiceover.mp3');
    
    if (response.AudioStream) {
      // Use the AWS SDK's transformToByteArray method to convert the stream to a buffer
      const audioData = await response.AudioStream.transformToByteArray();
      fs.writeFileSync(audioPath, Buffer.from(audioData));
    }

    return audioPath;
  } catch (error) {
    console.error('Error in createVoiceover:', error);
    throw new Error(`Failed to create voiceover: ${error}`);
  }
}

/**
 * Agent 4: Cinematic Trailer Agent
 * Combines images and audio into a video trailer
 */
async function createTrailerVideo(imagePaths: string[], audioPath: string): Promise<string> {
  try {
    // Create a file with image inputs for ffmpeg
    const inputFile = path.join(tempDir, 'input.txt');
    const imageInputs = imagePaths.map(imgPath => {
      // Each image shown for ~3-4 seconds
      return `file '${imgPath}'\nduration 3.5`;
    }).join('\n');
    fs.writeFileSync(inputFile, imageInputs);

    // Output video path
    const outputPath = path.join(tempDir, `trailer-${uuidv4()}.mp4`);

    // Use ffmpeg to create the video
    const ffmpegPath = require('ffmpeg-static');
    
    // Create video from images
    await execAsync(`"${ffmpegPath}" -f concat -safe 0 -i "${inputFile}" -c:v libx264 -pix_fmt yuv420p -preset medium -r 30 -y "${path.join(tempDir, 'temp_video.mp4')}"`);
    
    // Add audio to the video
    await execAsync(`"${ffmpegPath}" -i "${path.join(tempDir, 'temp_video.mp4')}" -i "${audioPath}" -c:v copy -c:a aac -shortest -y "${outputPath}"`);

    return outputPath;
  } catch (error) {
    console.error('Error in createTrailerVideo:', error);
    throw new Error(`Failed to create trailer video: ${error}`);
  }
}

/**
 * Upload the video to S3 and return a signed URL
 */
async function uploadToS3(videoPath: string): Promise<string> {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not set');
    }

    const key = `trailers/${path.basename(videoPath)}`;
    const fileContent = fs.readFileSync(videoPath);

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'video/mp4'
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate a signed URL for the uploaded video
    const signedUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;
    return signedUrl;
  } catch (error) {
    console.error('Error in uploadToS3:', error);
    throw new Error(`Failed to upload video to S3: ${error}`);
  }
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  try {
    fs.readdirSync(tempDir).forEach(file => {
      fs.unlinkSync(path.join(tempDir, file));
    });
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}

/**
 * POST handler for /api/trailer-generator
 * Orchestrates the workflow of script to trailer generation
 */
export async function POST(req: NextRequest) {
  try {
    // Check for x402 payment JWT header (both uppercase and lowercase)
    const paymentHeader = req.headers.get('X-PAYMENT') || req.headers.get('x-payment');
    
    // If the X-PAYMENT header is missing, return 402 Payment Required
    if (!paymentHeader) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "X-PAYMENT header is required",
          accepts: [
            {
              scheme: "exact",
              network: "base-sepolia",
              maxAmountRequired: "150000",
              resource: "http://localhost:3000/api/trailer-generator",
              description: "Script-to-Trailer Generator service",
              mimeType: "application/json",
              payTo: "0x9D9e34611ab141a704d24368E8C0E900FbE7b0DF", // Replace with your actual address
              maxTimeoutSeconds: 600,
              asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
              extra: {
                name: "USDC",
                version: "2"
              }
            }
          ]
        },
        { status: 402 }
      );
    }
    
    // TODO: In a production environment, you would validate the X-PAYMENT JWT here
    // For now, we'll just proceed if the X-PAYMENT header is present
    
    // Parse the request body
    const { script, style, mood } = await req.json();
    
    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Script is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Optional parameters with defaults
    const trailerStyle = style || 'cinematic';
    const trailerMood = mood || 'dramatic';

    // Step 1: Summarize the script into key scenes
    const scenes = await summarizeScript(script);
    
    // Step 2: Create visual art for each scene
    const imagePaths = await createSceneArt(scenes);
    
    // Step 3: Generate voiceover for the trailer
    const audioPath = await createVoiceover(scenes);
    
    // Step 4: Create the trailer video
    const videoPath = await createTrailerVideo(imagePaths, audioPath);
    
    // Step 5: Upload the video to S3 (if configured)
    let videoUrl = '';
    if (process.env.S3_BUCKET_NAME) {
      videoUrl = await uploadToS3(videoPath);
    } else {
      // For local development, we could serve the file directly
      videoUrl = `/api/trailer-generator/videos/${path.basename(videoPath)}`;
    }
    
    // Clean up temporary files
    cleanupTempFiles();
    
    // Return the result
    return NextResponse.json({
      success: true,
      scenes,
      videoUrl
    });
  } catch (error) {
    console.error('Error in trailer generator:', error);
    return NextResponse.json(
      { error: 'Failed to generate trailer', details: String(error) },
      { status: 500 }
    );
  }
}
