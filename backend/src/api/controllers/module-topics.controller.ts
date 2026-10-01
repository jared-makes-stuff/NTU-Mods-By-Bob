import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { getQueryString } from '../utils/request';

/**
 * Get all topics for a specific module
 * GET /api/modules/:moduleCode/topics
 */
export async function getModuleTopics(req: Request, res: Response) {
  try {
    const moduleCode = getQueryString(req.params.moduleCode);
    if (!moduleCode) {
      res.status(400).json({ error: 'Module code is required' });
      return;
    }
    
    // Get all topics for the module, organized hierarchically
    const topics = await prisma.moduleTopic.findMany({
      where: { 
        moduleCode: moduleCode.toUpperCase(),
        parentId: null, // Get only root topics
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        children: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            children: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    res.json({ topics });
    return;
  } catch (error) {
    logger.error('Error fetching module topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
    return;
  }
}

/**
 * Create a new topic for a module
 * POST /api/modules/:moduleCode/topics
 */
export async function createModuleTopic(req: Request, res: Response) {
  try {
    const moduleCode = getQueryString(req.params.moduleCode);
    if (!moduleCode) {
      res.status(400).json({ error: 'Module code is required' });
      return;
    }
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, duration, level, parentId, orderIndex, weekTaught, suggestedEdit, editReason } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Topic name is required' });
      return;
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parent = await prisma.moduleTopic.findUnique({
        where: { id: parentId },
      });

      if (!parent || parent.moduleCode !== moduleCode.toUpperCase()) {
        res.status(400).json({ error: 'Invalid parent topic' });
        return;
      }
    }

    const topic = await prisma.moduleTopic.create({
      data: {
        moduleCode: moduleCode.toUpperCase(),
        name: name.trim(),
        duration,
        level: level || 1,
        parentId,
        submittedBy: userId,
        orderIndex: orderIndex || 0,
        weekTaught: weekTaught || null,
        suggestedEdit: suggestedEdit || null,
        editReason: editReason || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(topic);
    return;
  } catch (error) {
    logger.error('Error creating module topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
    return;
  }
}

/**
 * Update an existing topic
 * PUT /api/modules/:moduleCode/topics/:topicId
 */
export async function updateModuleTopic(req: Request, res: Response) {
  try {
    const topicId = getQueryString(req.params.topicId);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!topicId) {
      res.status(400).json({ error: 'Topic ID is required' });
      return;
    }

    // Check if topic exists and belongs to user
    const existingTopic = await prisma.moduleTopic.findUnique({
      where: { id: topicId },
    });

    if (!existingTopic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    if (existingTopic.submittedBy !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'You can only update your own topics' });
      return;
    }

    const { name, duration, orderIndex, weekTaught, suggestedEdit, editReason } = req.body;

    const topic = await prisma.moduleTopic.update({
      where: { id: topicId },
      data: {
        name: name?.trim(),
        duration,
        orderIndex,
        weekTaught,
        suggestedEdit,
        editReason,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(topic);
    return;
  } catch (error) {
    logger.error('Error updating module topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
    return;
  }
}

/**
 * Delete a topic
 * DELETE /api/modules/:moduleCode/topics/:topicId
 */
export async function deleteModuleTopic(req: Request, res: Response) {
  try {
    const topicId = getQueryString(req.params.topicId);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!topicId) {
      res.status(400).json({ error: 'Topic ID is required' });
      return;
    }

    // Check if topic exists and belongs to user
    const existingTopic = await prisma.moduleTopic.findUnique({
      where: { id: topicId },
    });

    if (!existingTopic) {
      res.status(404).json({ error: 'Topic not found' });
      return;
    }

    if (existingTopic.submittedBy !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'You can only delete your own topics' });
      return;
    }

    // Note: Cascade delete will handle children
    await prisma.moduleTopic.delete({
      where: { id: topicId },
    });

    res.json({ message: 'Topic deleted successfully' });
    return;
  } catch (error) {
    logger.error('Error deleting module topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
    return;
  }
}

/**
 * Upvote a topic
 * POST /api/modules/:moduleCode/topics/:topicId/vote
 */
export async function voteTopic(req: Request, res: Response) {
  try {
    const topicId = getQueryString(req.params.topicId);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!topicId) {
      res.status(400).json({ error: 'Topic ID is required' });
      return;
    }

    const topic = await prisma.moduleTopic.update({
      where: { id: topicId },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });

    res.json({ upvotes: topic.upvotes });
    return;
  } catch (error) {
    logger.error('Error voting on topic:', error);
    res.status(500).json({ error: 'Failed to vote on topic' });
    return;
  }
}
