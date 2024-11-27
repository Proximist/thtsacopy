import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { telegramId, taskType, points } = await req.json();

    // Validate input
    if (!telegramId || !taskType || !points) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { 
        id: true, 
        telegramId: true, 
        points: true, 
        invitedUsers: true,
        completedTasks: true 
      }
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Validate task completion conditions
    if (taskType === 'invite_friends') {
      // Check if user has invited at least 3 friends
      if (!user.invitedUsers || user.invitedUsers.length < 3) {
        return NextResponse.json({ 
          success: false, 
          error: 'Not enough invited friends' 
        }, { status: 400 });
      }

      // Check if task has already been completed
      const completedTasks = user.completedTasks || [];
      if (completedTasks.includes('invite_friends')) {
        return NextResponse.json({ 
          success: true, 
          points: user.points,
          taskStatus: 'done'
        });
      }

      // Update user with points and mark task as completed
      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: {
          points: {
            increment: points
          },
          completedTasks: {
            push: 'invite_friends'
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        points: updatedUser.points,
        taskStatus: 'done' 
      });
    }

    // Handle other task types if needed in the future
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid task type' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error claiming task points:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
