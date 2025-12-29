import type { ClusterResult, ScrapedTweet } from '../../../../../shared/src/types';
import type { BookmarkNode, ClusterCloud, ConnectionEdge, GalaxyData, ContentType } from './types';
import { CLUSTER_COLORS, CONTENT_TYPE_Z } from './types';

/**
 * Classify a tweet's content type based on its content and links
 */
function classifyContentType(tweet: ScrapedTweet): ContentType {
  // GitHub repos = tools
  if (tweet.linkContext?.type === 'github') {
    return 'tool';
  }

  // External articles
  if (tweet.linkContext?.type === 'twitter_article' || tweet.linkContext?.type === 'other') {
    return 'article';
  }

  // Thread indicators: 🧵 emoji, "thread" word, numbered lists, long text
  const text = tweet.text.toLowerCase();
  const isThread =
    text.includes('🧵') ||
    text.includes('thread') ||
    /^\d+[\.\)\/]/.test(text) || // starts with "1." or "1)" etc
    tweet.text.length > 400; // long tweets are usually threads

  if (isThread) {
    return 'thread';
  }

  return 'tweet';
}

/**
 * Transform cluster data into 3D galaxy visualization data
 * Z-axis = content type (tools high, tweets low)
 */
export function transformToGalaxyData(clusters: ClusterResult[]): GalaxyData {
  const nodes: BookmarkNode[] = [];
  const clusterClouds: ClusterCloud[] = [];
  const edges: ConnectionEdge[] = [];

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

    // Add cluster cloud (Z will be updated after processing nodes)
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
      const contentType = classifyContentType(tweet);

      // Calculate engagement score for node size
      const engagement = tweet.metrics
        ? (tweet.metrics.likes + tweet.metrics.retweets * 2 + tweet.metrics.replies)
        : 10;
      const size = Math.min(0.5, 0.1 + Math.log10(engagement + 1) * 0.1);

      // Spread nodes around cluster center
      const nodeAngle = (tweetIndex / cluster.tweets.length) * Math.PI * 2 + Math.random() * 0.5;
      const nodeRadius = 1.5 + Math.random() * 2;

      const nodeX = clusterCenterX + Math.cos(nodeAngle) * nodeRadius;
      const nodeY = clusterCenterY + Math.sin(nodeAngle) * nodeRadius;

      // Flat 2D map - all nodes on same plane with slight variation for depth
      const nodeZ = (Math.random() - 0.5) * 0.5; // Very small Z variation

      const node: BookmarkNode = {
        id: tweet.id,
        tweet,
        clusterId: cluster.id,
        clusterLabel: cluster.label,
        position: [nodeX, nodeY, nodeZ],
        color: clusterColor,
        size,
        timestamp,
        contentType,
        authorId: tweet.authorHandle,
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

  // Cluster centers stay at Z=0 for flat 2D map
  clusterClouds.forEach(cloud => {
    cloud.center[2] = 0;
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
  };
}

/**
 * Get content type label for display
 */
export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    tool: 'Tool/Repo',
    article: 'Article',
    thread: 'Thread',
    tweet: 'Tweet',
  };
  return labels[type];
}
