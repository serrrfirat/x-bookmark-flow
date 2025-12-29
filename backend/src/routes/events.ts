import { Router } from 'express';
import { agentEvents, type AgentEvent } from '../services/agentEvents.js';

export const eventsRouter = Router();

/**
 * SSE endpoint for streaming agent activity
 * GET /api/events
 */
eventsRouter.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', content: 'listening for agent events', timestamp: new Date().toISOString() })}\n\n`);

  // Handle agent events
  const handleEvent = (event: AgentEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  agentEvents.on('agent-event', handleEvent);

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    agentEvents.off('agent-event', handleEvent);
  });
});
