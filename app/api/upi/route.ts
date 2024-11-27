import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { telegramId, upiId, action } = await req.json();

    // Validate input
    if (!telegramId || !upiId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    if (action === 'save') {
      // Save UPI ID
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: {
          upiIds: {
            push: upiId
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        upiIds: updatedUser.upiIds 
      });
    } else if (action === 'request') {
      // Add UPI ID to requests
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: {
          upiRequests: {
            push: upiId
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        upiRequests: updatedUser.upiRequests 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error managing UPI ID:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
