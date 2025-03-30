import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { WallpaperSchema } from '../route';

/**
 * Test endpoint for wallpaper submissions - helps diagnose validation issues
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Test API: Received wallpaper submission');
    
    // Parse the request body
    const rawData = await req.json();
    console.log('Test API: Raw data received:', JSON.stringify(rawData, null, 2));
    
    // Validate the data against the schema
    try {
      const validatedData = WallpaperSchema.parse(rawData);
      console.log('Test API: Validation successful. Validated data:', JSON.stringify(validatedData, null, 2));
      
      return NextResponse.json({ 
        success: true, 
        message: 'Wallpaper data validation successful',
        validatedData 
      });
    } catch (validationError) {
      console.error('Test API: Validation error:', validationError);
      
      if (validationError instanceof ZodError) {
        const formattedErrors = validationError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return NextResponse.json({ 
          success: false, 
          message: 'Validation failed',
          errors: formattedErrors 
        }, { status: 400 });
      }
      
      throw validationError;
    }
  } catch (error: any) {
    console.error('Test API: Unexpected error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Server error',
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 