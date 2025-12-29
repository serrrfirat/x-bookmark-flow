import type { ClusterResult } from '../../../../../shared/src/types';
import type { BookmarkNode, ClusterCloud, ConnectionEdge, GalaxyData } from './types';
import { CLUSTER_COLORS } from './types';

/**
 * Transform cluster data into 3D galaxy visualization data
 */
export function transformToGalaxyData(clusters: ClusterResult[]): GalaxyData {
  const nodes: BookmarkNode[] = [];
  const clusterClouds: ClusterCloud[] = [];
  const edges: ConnectionEdge[] = [];

  // Track time range
  let minTime = Infinity;
  let maxTime = -Infinity;

  // Track authors for connection edges
  const authorToNodes: Map<string, string[]> = new Map();
  const linkToNodes: Map<string, string[]> = new Map();

  // Process each cluster
  clusters.forEach((cluster, clusterIndex) => {
    const clusterColor = CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length];
    const clusterAngle = (clusterIndex / clusters.length) * Math.PI * 2;
    const clusterRadius = 8 + clusterIndex * 2;

    // Cluster center position on X/Y plane
    const clusterCenterX = Math.cos(clusterAngle) * clusterRadius;
    const clusterCenterY = Math.sin(clusterAngle) * clusterRadius;

    // Add cluster cloud
    clusterClouds.push({
      id: cluster.id,
      label: cluster.label,
      center: [clusterCenterX, clusterCenterY, 0],
      color: clusterColor,
      nodeCount: cluster.tweets.length,
    });

    // Process tweets in this cluster
    cluster.tweets.forEach((tweet, tweetIndex) => {
      const timestamp = new Date(tweet.timestamp).getTime();
      minTime = Math.min(minTime, timestamp);
      maxTime = Math.max(maxTime, timestamp);

      // Calculate engagement score for node size
      const engagement = tweet.metrics
        ? (tweet.metrics.likes + tweet.metrics.retweets * 2 + tweet.metrics.replies)
        : 10;
      const size = Math.min(0.5, 0.1 + Math.log10(engagement + 1) * 0.1);

      // Spread nodes around cluster center with some randomness
      const nodeAngle = (tweetIndex / cluster.tweets.length) * Math.PI * 2 + Math.random() * 0.5;
      const nodeRadius = 1.5 + Math.random() * 2;

      const nodeX = clusterCenterX + Math.cos(nodeAngle) * nodeRadius;
      const nodeY = clusterCenterY + Math.sin(nodeAngle) * nodeRadius;

      const node: BookmarkNode = {
        id: tweet.id,
        tweet,
        clusterId: cluster.id,
        clusterLabel: cluster.label,
        position: [nodeX, nodeY, 0], // Z will be set based on time after we know the range
        color: clusterColor,
        size,
        timestamp,
      };

      nodes.push(node);

      // Track author connections
      if (!authorToNodes.has(tweet.authorHandle)) {
        authorToNodes.set(tweet.authorHandle, []);
      }
      authorToNodes.get(tweet.authorHandle)!.push(tweet.id);

      // Track link connections
      if (tweet.linkContext?.url) {
        if (!linkToNodes.has(tweet.linkContext.url)) {
          linkToNodes.set(tweet.linkContext.url, []);
        }
        linkToNodes.get(tweet.linkContext.url)!.push(tweet.id);
      }
    });
  });

  // Normalize time to Z axis (0 to 20, recent at top)
  const timeRange = maxTime - minTime || 1;
  nodes.forEach(node => {
    const normalizedTime = (node.timestamp - minTime) / timeRange;
    node.position[2] = normalizedTime * 20 - 10; // -10 to 10
  });

  // Update cluster centers Z based on average of their nodes
  clusterClouds.forEach(cloud => {
    const clusterNodes = nodes.filter(n => n.clusterId === cloud.id);
    if (clusterNodes.length > 0) {
      const avgZ = clusterNodes.reduce((sum, n) => sum + n.position[2], 0) / clusterNodes.length;
      cloud.center[2] = avgZ;
    }
  });

  // Create author connection edges (same author = connected)
  authorToNodes.forEach((nodeIds, author) => {
    if (nodeIds.length > 1) {
      // Connect each pair (limit to avoid too many edges)
      for (let i = 0; i < Math.min(nodeIds.length - 1, 5); i++) {
        edges.push({
          id: `author-${author}-${i}`,
          from: nodeIds[i],
          to: nodeIds[i + 1],
          type: 'author',
          strength: 0.5,
        });
      }
    }
  });

  // Create link connection edges (shared links = connected)
  linkToNodes.forEach((nodeIds, link) => {
    if (nodeIds.length > 1) {
      for (let i = 0; i < Math.min(nodeIds.length - 1, 3); i++) {
        edges.push({
          id: `link-${encodeURIComponent(link)}-${i}`,
          from: nodeIds[i],
          to: nodeIds[i + 1],
          type: 'link',
          strength: 0.8,
        });
      }
    }
  });

  return {
    nodes,
    clusters: clusterClouds,
    edges,
    timeRange: { min: minTime, max: maxTime },
  };
}

/**
 * Format timestamp for display
 */
export function formatTimeLabel(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get position in 3D space for a time value
 */
export function getTimePosition(timestamp: number, minTime: number, maxTime: number): number {
  const range = maxTime - minTime || 1;
  const normalized = (timestamp - minTime) / range;
  return normalized * 20 - 10;
}
