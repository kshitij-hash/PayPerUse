import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { cwd } from 'process';

/**
 * GET handler for /api/agents
 * Returns the list of available agents
 */
export async function GET() {
  try {
    // Get the current working directory
    const currentDir = cwd();
    console.log('Current working directory:', currentDir);
    console.log('Process cwd:', process.cwd());
    
    // Read the agents.json file from the project root
    const filePath = path.join(process.cwd(), 'agents.json');
    console.log('Looking for agents.json at path:', filePath);
    
    // Debug: List the contents of the current directory
    try {
      const files = await fs.readdir(process.cwd());
      console.log('Files in current directory:', files);
    } catch (dirError) {
      console.error('Error reading current directory:', dirError);
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
      console.log('agents.json exists at path');
    } catch (accessError) {
      console.error('agents.json access error:', accessError);
      console.error('agents.json does not exist at path:', filePath);
      // List files in the current directory for debugging
      const files = await fs.readdir(process.cwd());
      console.log('Files in current directory:', files);
      throw new Error(`agents.json not found in ${process.cwd()}. Files present: ${files.join(', ')}`);
    }
    
    const fileContents = await fs.readFile(filePath, 'utf8');
    console.log('File contents:', fileContents.substring(0, 200) + '...'); // Log first 200 chars
    
    const agentsData = JSON.parse(fileContents);
    console.log('Parsed agents data:', JSON.stringify(agentsData, null, 2));
    
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
