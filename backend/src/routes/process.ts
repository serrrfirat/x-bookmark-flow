import { Router } from 'express';
import { z } from 'zod';
import type { ProcessResponse, ErrorResponse } from '../../../shared/src/types';
import { processBookmarksWithAgent } from '../services/bookmarkProcessor.js';

export const processRouter = Router();

// Request validation schema
const processRequestSchema = z.object({
  tweets: z.array(z.object({
    id: z.string(),
    text: z.string(),
    authorHandle: z.string(),
    authorName: z.string(),
    url: z.string(),
    timestamp: z.string(),
    metrics: z.object({
      replies: z.number(),
      retweets: z.number(),
      likes: z.number(),
      views: z.number().optional(),
    }).optional(),
    scrapedAt: z.string(),
    linkContext: z.object({
      type: z.enum(['github', 'twitter_article', 'other']),
      url: z.string(),
      title: z.string().optional(),
      content: z.string(),
      extractedAt: z.string(),
    }).optional(),
  })),
  options: z.object({
    minClusterSize: z.number().optional(),
    maxClusters: z.number().optional(),
    tonePreset: z.enum(['neutral', 'founder', 'contrarian']).optional(),
    includeMetrics: z.boolean().optional(),
    mode: z.enum(['twitter', 'research']).optional(),
    existingClusters: z.array(z.object({
      id: z.string(),
      label: z.string(),
      summary: z.string(),
      tweetCount: z.number(),
    })).optional(),
  }).optional(),
});

processRouter.post('/process-bookmarks', async (req, res) => {
  try {
    // Validate request
    const parseResult = processRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request format',
          details: parseResult.error.errors,
        },
      };
      return res.status(400).json(errorResponse);
    }

    const { tweets, options } = parseResult.data;

    if (tweets.length === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NO_TWEETS',
          message: 'No tweets provided',
        },
      };
      return res.status(400).json(errorResponse);
    }

    const mode = options?.mode || 'twitter';
    const existingClusters = options?.existingClusters;
    const isIncremental = !!(existingClusters && existingClusters.length > 0);

    console.log(`📥 Processing ${tweets.length} bookmarks with Claude Code Agent (mode: ${mode}, incremental: ${isIncremental}, existing clusters: ${existingClusters?.length || 0})...`);

    // Process all bookmarks with Claude Agent
    const result = await processBookmarksWithAgent(
      tweets,
      options?.tonePreset || 'founder',
      mode,
      existingClusters
    );

    console.log(`✅ Processing complete in ${result.meta.processingTimeMs}ms`);

    const response: ProcessResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Processing error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };

    res.status(500).json(errorResponse);
  }
});
