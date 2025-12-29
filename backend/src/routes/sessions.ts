import { Router } from 'express';
import { getSessions, getSession, getLatestSession, deleteSession } from '../services/storage.js';
import type { ErrorResponse } from '../../../shared/src/types';

export const sessionsRouter = Router();

/**
 * GET /api/sessions - List all sessions
 */
sessionsRouter.get('/sessions', (req, res) => {
  try {
    const sessions = getSessions();
    res.json({ success: true, data: sessions });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get sessions',
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/sessions/latest - Get the most recent session
 */
sessionsRouter.get('/sessions/latest', (req, res) => {
  try {
    const result = getLatestSession();

    if (!result) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: {
        clusters: result.clusters,
        meta: {
          totalTweets: result.session.totalBookmarks,
          processedTweets: result.session.totalBookmarks,
          filteredTweets: 0,
          clustersGenerated: result.session.clustersCount,
          processingTimeMs: 0,
          sessionId: result.session.id,
          createdAt: result.session.createdAt,
        },
      },
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get latest session',
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/sessions/:id - Get a specific session
 */
sessionsRouter.get('/sessions/:id', (req, res) => {
  try {
    const result = getSession(req.params.id);

    if (!result) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
      return res.status(404).json(errorResponse);
    }

    res.json({
      success: true,
      data: {
        clusters: result.clusters,
        meta: {
          totalTweets: result.session.totalBookmarks,
          processedTweets: result.session.totalBookmarks,
          filteredTweets: 0,
          clustersGenerated: result.session.clustersCount,
          processingTimeMs: 0,
          sessionId: result.session.id,
          createdAt: result.session.createdAt,
        },
      },
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get session',
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * DELETE /api/sessions/:id - Delete a session
 */
sessionsRouter.delete('/sessions/:id', (req, res) => {
  try {
    const deleted = deleteSession(req.params.id);

    if (!deleted) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
      return res.status(404).json(errorResponse);
    }

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete session',
      },
    };
    res.status(500).json(errorResponse);
  }
});
