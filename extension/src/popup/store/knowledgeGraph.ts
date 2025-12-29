/**
 * Persistent Knowledge Graph Storage
 *
 * Stores clusters and tweets in chrome.storage.local
 * so they persist across sessions and grow over time.
 */

import type { ClusterResult, ScrapedTweet } from '../../../../shared/src/types';

export interface KnowledgeGraph {
  clusters: ClusterResult[];
  seenTweetIds: string[]; // Track which tweets we've already processed
  lastUpdated: string;
  totalBookmarks: number;
}

const STORAGE_KEY = 'knowledgeGraph';

/**
 * Load the knowledge graph from chrome.storage
 */
export async function loadKnowledgeGraph(): Promise<KnowledgeGraph | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        resolve(result[STORAGE_KEY] as KnowledgeGraph);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Save the knowledge graph to chrome.storage
 */
export async function saveKnowledgeGraph(graph: KnowledgeGraph): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: graph }, resolve);
  });
}

/**
 * Filter out tweets we've already processed
 */
export function filterNewTweets(
  tweets: ScrapedTweet[],
  seenIds: string[]
): ScrapedTweet[] {
  const seenSet = new Set(seenIds);
  return tweets.filter((tweet) => !seenSet.has(tweet.id));
}

/**
 * Get cluster labels for context (sent to backend)
 */
export function getClusterContext(clusters: ClusterResult[]): {
  id: string;
  label: string;
  summary: string;
  tweetCount: number;
}[] {
  return clusters.map((c) => ({
    id: c.id,
    label: c.label,
    summary: c.summary,
    tweetCount: c.tweetCount,
  }));
}

/**
 * Merge new clusters with existing ones
 * - If backend returns existing cluster ID, add tweets to that cluster
 * - If backend returns new cluster, add it to the list
 */
export function mergeClusterResults(
  existingClusters: ClusterResult[],
  newResults: ClusterResult[]
): ClusterResult[] {
  const clusterMap = new Map<string, ClusterResult>();

  // Add existing clusters to map
  for (const cluster of existingClusters) {
    clusterMap.set(cluster.id, { ...cluster });
  }

  // Merge or add new results
  for (const newCluster of newResults) {
    const existing = clusterMap.get(newCluster.id);

    if (existing) {
      // Merge tweets into existing cluster
      const existingTweetIds = new Set(existing.tweets.map((t) => t.id));
      const uniqueNewTweets = newCluster.tweets.filter(
        (t) => !existingTweetIds.has(t.id)
      );

      existing.tweets = [...existing.tweets, ...uniqueNewTweets];
      existing.tweetCount = existing.tweets.length;

      // Update insights if new ones provided
      if (newCluster.insights?.length) {
        existing.insights = [
          ...new Set([...existing.insights, ...newCluster.insights]),
        ];
      }

      // Keep the latest thread/post
      if (newCluster.thread) {
        existing.thread = newCluster.thread;
      }
    } else {
      // Add as new cluster
      clusterMap.set(newCluster.id, newCluster);
    }
  }

  return Array.from(clusterMap.values());
}

/**
 * Initialize or update the knowledge graph with new results
 */
export async function updateKnowledgeGraph(
  newClusters: ClusterResult[],
  processedTweets: ScrapedTweet[]
): Promise<KnowledgeGraph> {
  const existing = await loadKnowledgeGraph();

  const graph: KnowledgeGraph = {
    clusters: existing
      ? mergeClusterResults(existing.clusters, newClusters)
      : newClusters,
    seenTweetIds: [
      ...(existing?.seenTweetIds || []),
      ...processedTweets.map((t) => t.id),
    ],
    lastUpdated: new Date().toISOString(),
    totalBookmarks: 0,
  };

  // Dedupe seen IDs
  graph.seenTweetIds = [...new Set(graph.seenTweetIds)];
  graph.totalBookmarks = graph.seenTweetIds.length;

  await saveKnowledgeGraph(graph);
  return graph;
}

/**
 * Clear the knowledge graph (reset)
 */
export async function clearKnowledgeGraph(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEY], resolve);
  });
}

/**
 * Get stats about the knowledge graph
 */
export async function getKnowledgeGraphStats(): Promise<{
  clusterCount: number;
  totalBookmarks: number;
  lastUpdated: string | null;
} | null> {
  const graph = await loadKnowledgeGraph();
  if (!graph) return null;

  return {
    clusterCount: graph.clusters.length,
    totalBookmarks: graph.totalBookmarks,
    lastUpdated: graph.lastUpdated,
  };
}
