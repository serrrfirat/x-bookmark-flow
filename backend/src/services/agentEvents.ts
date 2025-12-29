import { EventEmitter } from 'events';

export interface AgentEvent {
  type: 'status' | 'thinking' | 'tool_use' | 'tool_result' | 'text' | 'complete' | 'error';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class AgentEventEmitter extends EventEmitter {
  emit(event: 'agent-event', data: AgentEvent): boolean {
    return super.emit(event, data);
  }

  on(event: 'agent-event', listener: (data: AgentEvent) => void): this {
    return super.on(event, listener);
  }

  off(event: 'agent-event', listener: (data: AgentEvent) => void): this {
    return super.off(event, listener);
  }
}

export const agentEvents = new AgentEventEmitter();

export function emitAgentEvent(
  type: AgentEvent['type'],
  content: string,
  metadata?: Record<string, unknown>
) {
  agentEvents.emit('agent-event', {
    type,
    content,
    timestamp: new Date().toISOString(),
    metadata,
  });
}
