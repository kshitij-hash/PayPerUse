import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET handler for /api/services
 * Returns all available registered services from services.json
 */
export async function GET() {
  try {
    // Read the services.json file
    const servicesPath = path.join(process.cwd(), 'services.json');
    const servicesData = fs.readFileSync(servicesPath, 'utf8');
    const services = JSON.parse(servicesData);

    // Return the services data
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
