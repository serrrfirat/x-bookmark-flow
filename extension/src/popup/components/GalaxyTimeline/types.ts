import type { ScrapedTweet, ClusterResult } from '../../../../../shared/src/types';

// Content type determines Z-axis position
export type ContentType = 'tool' | 'article' | 'thread' | 'tweet';

export interface BookmarkNode {
  id: string;
  tweet: ScrapedTweet;
  clusterId: string;
  clusterLabel: string;
  position: [number, number, number];
  color: string;
  size: number;
  timestamp: number;
  contentType: ContentType;
  authorId: string; // For author-based connections
}

export interface ClusterCloud {
  id: string;
  label: string;
  center: [number, number, number];
  color: string;
  nodeCount: number;
}

export interface ConnectionEdge {
  id: string;
  from: string;
  to: string;
  type: 'author' | 'link' | 'cluster';
  strength: number;
}

export interface GalaxyData {
  nodes: BookmarkNode[];
  clusters: ClusterCloud[];
  edges: ConnectionEdge[];
}

// Z-axis positions for content types (tools float highest)
export const CONTENT_TYPE_Z: Record<ContentType, number> = {
  tool: 8,      // GitHub repos, tools to try - top
  article: 3,   // Articles, deep reads - upper middle
  thread: -2,   // Threads, knowledge dumps - lower middle
  tweet: -7,    // Quick tweets - bottom
};

// Cluster color palette
export const CLUSTER_COLORS = [
  '#60A5FA', // blue
  '#34D399', // emerald
  '#F472B6', // pink
  '#FBBF24', // amber
  '#A78BFA', // violet
  '#F87171', // red
  '#2DD4BF', // teal
  '#FB923C', // orange
];

export interface GalaxyTimelineProps {
  clusters: ClusterResult[];
  onNodeClick?: (node: BookmarkNode) => void;
  onNodeHover?: (node: BookmarkNode | null) => void;
}
