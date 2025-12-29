/**
 * Storage utilities for persisting processed tweet IDs and knowledge graph
 */

import type { ClusterResult, ScrapedTweet } from '../../../shared/src/types';

const PROCESSED_TWEETS_KEY = 'processedTweetIds';
const KNOWLEDGE_GRAPH_KEY = 'knowledgeGraph';
const MAX_STORED_IDS = 10000; // Limit to prevent storage bloat

// Knowledge Graph types
export interface KnowledgeGraph {
  clusters: ClusterResult[];
  lastUpdated: string;
  totalBookmarks: number;
}

/**
 * Get all processed tweet IDs from storage
 */
export async function getProcessedTweetIds(): Promise<Set<string>> {
  try {
    const result = await chrome.storage.local.get(PROCESSED_TWEETS_KEY);
    const ids = result[PROCESSED_TWEETS_KEY] || [];
    return new Set(ids);
  } catch (error) {
    console.error('[Storage] Error loading processed IDs:', error);
    return new Set();
  }
}

/**
 * Add tweet IDs to the processed set
 */
export async function addProcessedTweetIds(ids: string[]): Promise<void> {
  try {
    const existing = await getProcessedTweetIds();

    // Add new IDs
    for (const id of ids) {
      existing.add(id);
    }

    // Convert to array and trim if too large (keep most recent)
    let idsArray = Array.from(existing);
    if (idsArray.length > MAX_STORED_IDS) {
      idsArray = idsArray.slice(-MAX_STORED_IDS);
    }

    await chrome.storage.local.set({ [PROCESSED_TWEETS_KEY]: idsArray });
    console.log(`[Storage] Saved ${ids.length} new IDs. Total: ${idsArray.length}`);
  } catch (error) {
    console.error('[Storage] Error saving processed IDs:', error);
  }
}

/**
 * Clear all processed tweet IDs
 */
export async function clearProcessedTweetIds(): Promise<void> {
  try {
    await chrome.storage.local.remove(PROCESSED_TWEETS_KEY);
    console.log('[Storage] Cleared all processed tweet IDs');
  } catch (error) {
    console.error('[Storage] Error clearing processed IDs:', error);
  }
}

/**
 * Get count of processed tweets
 */
export async function getProcessedCount(): Promise<number> {
  const ids = await getProcessedTweetIds();
  return ids.size;
}

// ============================================
// Knowledge Graph Storage
// ============================================

/**
 * Load the knowledge graph from storage
 */
export async function loadKnowledgeGraph(): Promise<KnowledgeGraph | null> {
  try {
    const result = await chrome.storage.local.get(KNOWLEDGE_GRAPH_KEY);
    return result[KNOWLEDGE_GRAPH_KEY] || null;
  } catch (error) {
    console.error('[Storage] Error loading knowledge graph:', error);
    return null;
  }
}

/**
 * Save the knowledge graph to storage
 */
export async function saveKnowledgeGraph(graph: KnowledgeGraph): Promise<void> {
  try {
    const dataSize = JSON.stringify(graph).length;
    console.log(`[Storage] Saving knowledge graph: ${graph.clusters.length} clusters, ${graph.totalBookmarks} bookmarks, ${Math.round(dataSize / 1024)}KB`);

    await chrome.storage.local.set({ [KNOWLEDGE_GRAPH_KEY]: graph });
    console.log(`[Storage] ✅ Knowledge graph saved successfully`);
  } catch (error) {
    console.error('[Storage] ❌ Error saving knowledge graph:', error);
  }
}

/**
 * Get cluster context for API (lightweight version without tweets)
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
 */
export function mergeClusterResults(
  existingClusters: ClusterResult[],
  newResults: ClusterResult[]
): ClusterResult[] {
  const clusterMap = new Map<string, ClusterResult>();

  // Add existing clusters to map
  for (const cluster of existingClusters) {
    clusterMap.set(cluster.id, { ...cluster, tweets: [...cluster.tweets] });
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

      // Update summary if provided
      if (newCluster.summary) {
        existing.summary = newCluster.summary;
      }
    } else {
      // Add as new cluster
      clusterMap.set(newCluster.id, { ...newCluster, tweets: [...newCluster.tweets] });
    }
  }

  return Array.from(clusterMap.values());
}

/**
 * Update knowledge graph with new results
 */
export async function updateKnowledgeGraph(
  newClusters: ClusterResult[]
): Promise<KnowledgeGraph> {
  console.log(`[Storage] updateKnowledgeGraph called with ${newClusters?.length || 0} new clusters`);

  if (!newClusters || newClusters.length === 0) {
    console.warn('[Storage] No clusters to save!');
  }

  const existing = await loadKnowledgeGraph();

  const mergedClusters = existing
    ? mergeClusterResults(existing.clusters, newClusters)
    : newClusters;

  // Count total bookmarks
  const totalBookmarks = mergedClusters.reduce(
    (sum, c) => sum + c.tweets.length,
    0
  );

  const graph: KnowledgeGraph = {
    clusters: mergedClusters,
    lastUpdated: new Date().toISOString(),
    totalBookmarks,
  };

  await saveKnowledgeGraph(graph);
  return graph;
}

/**
 * Clear the knowledge graph
 */
export async function clearKnowledgeGraph(): Promise<void> {
  try {
    await chrome.storage.local.remove(KNOWLEDGE_GRAPH_KEY);
    console.log('[Storage] Cleared knowledge graph');
  } catch (error) {
    console.error('[Storage] Error clearing knowledge graph:', error);
  }
}
