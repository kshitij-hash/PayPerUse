import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * GET handler for /api/agents
 * Returns the list of available agents
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'agents.json');

    try {
      await fs.access(filePath);
    } catch (accessError) {
      console.error('agents.json access error:', accessError);
      console.error('agents.json does not exist at path:', filePath);
      const files = await fs.readdir(process.cwd());
      throw new Error(`agents.json not found in ${process.cwd()}. Files present: ${files.join(', ')}`);
    }
    
    const fileContents = await fs.readFile(filePath, 'utf8');
    
    const agentsData = JSON.parse(fileContents);
    
    return NextResponse.json(agentsData);
  } catch (error) {
    console.error('Error reading agents.json:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load agents',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
