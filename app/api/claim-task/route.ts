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

    // Validate task completion conditions based on task type
    const completedTasks = user.completedTasks || [];

    // Map task types to their specific conditions
    const taskConditions = {
      'invite_1_friend': {
        requiredInvites: 1,
        taskKey: 'invite_1_friend'
      },
      'invite_3_friends': {
        requiredInvites: 3,
        taskKey: 'invite_3_friends'
      },
      'invite_10_friends': {
        requiredInvites: 10,
        taskKey: 'invite_10_friends'
      }
    };

    const taskConfig = taskConditions[taskType];

    if (!taskConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid task type' 
      }, { status: 400 });
    }

    // Check if user has met invite requirements
    if (!user.invitedUsers || user.invitedUsers.length < taskConfig.requiredInvites) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not enough invited friends' 
      }, { status: 400 });
    }

    // Check if task has already been completed
    if (completedTasks.includes(taskConfig.taskKey)) {
      return NextResponse.json({ 
        success: true, 
        points: user.points,
        taskStatus: 'done'
      });
    }

    // Update user with points, mark task as completed, and create claimed task record
    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: {
        points: {
          increment: points
        },
        completedTasks: {
          push: taskConfig.taskKey
        },
        claimedTasks: {
          create: {
            taskType: taskType,
            points: points
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      points: updatedUser.points,
      taskStatus: 'done' 
    });

  } catch (error) {
    console.error('Error claiming task points:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
