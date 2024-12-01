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
        completedTasks: true,
        taskButton1: true,
        taskButton2: true,
        taskButton3: true
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
      // Different logic for each task button
      let updateField = '';
      if (taskType === 'invite_friends' && points === 2) {
        // First task: 1 invite
        if (user.invitedUsers.length < 1 || user.taskButton1) {
          return NextResponse.json({ 
            success: false, 
            error: 'Task not completed or already claimed' 
          }, { status: 400 });
        }
        updateField = 'taskButton1';
      } else if (taskType === 'invite_friends' && points === 5) {
        // Second task: 3 invites
        if (user.invitedUsers.length < 3 || user.taskButton2) {
          return NextResponse.json({ 
            success: false, 
            error: 'Task not completed or already claimed' 
          }, { status: 400 });
        }
        updateField = 'taskButton2';
      } else if (taskType === 'invite_friends' && points === 30) {
        // Third task: 10 invites
        if (user.invitedUsers.length < 10 || user.taskButton3) {
          return NextResponse.json({ 
            success: false, 
            error: 'Task not completed or already claimed' 
          }, { status: 400 });
        }
        updateField = 'taskButton3';
      }

      // Update user with points and mark task button as claimed
      const updateData: any = {
        points: {
          increment: points
        }
      };
      updateData[updateField] = true;

      const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: updateData
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
