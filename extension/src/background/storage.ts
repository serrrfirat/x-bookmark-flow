/**
 * Storage utilities for persisting processed tweet IDs
 */

const PROCESSED_TWEETS_KEY = 'processedTweetIds';
const MAX_STORED_IDS = 10000; // Limit to prevent storage bloat

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
