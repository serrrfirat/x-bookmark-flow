import type { ScrapedTweet, TweetMetrics } from '../../../shared/src/types';
import { SELECTORS, getElement, getAllElements } from './selectors';
import { isGitHubLink, isTwitterArticle, extractLinksFromTweet, scrapeGitHub } from './linkScraper';

/**
 * Extract tweet ID from URL
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse engagement number (handles K, M suffixes)
 */
function parseEngagement(text: string | null): number {
  if (!text) return 0;
  const cleaned = text.trim().toLowerCase();
  if (cleaned.includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000);
  }
  if (cleaned.includes('m')) {
    return Math.round(parseFloat(cleaned) * 1000000);
  }
  return parseInt(cleaned, 10) || 0;
}

/**
 * Extract metrics from a tweet element
 */
function extractMetrics(tweetEl: Element): TweetMetrics | undefined {
  try {
    const replyEl = tweetEl.querySelector(SELECTORS.replyCount);
    const retweetEl = tweetEl.querySelector(SELECTORS.retweetCount);
    const likeEl = tweetEl.querySelector(SELECTORS.likeCount);
    
    // Get the aria-label which contains the count
    const replies = parseEngagement(replyEl?.getAttribute('aria-label')?.match(/\d+/)?.[0] || null);
    const retweets = parseEngagement(retweetEl?.getAttribute('aria-label')?.match(/\d+/)?.[0] || null);
    const likes = parseEngagement(likeEl?.getAttribute('aria-label')?.match(/\d+/)?.[0] || null);
    
    if (replies === 0 && retweets === 0 && likes === 0) {
      return undefined;
    }
    
    return { replies, retweets, likes };
  } catch {
    return undefined;
  }
}

/**
 * Extract a single tweet's data from its DOM element
 */
export function extractTweetData(tweetEl: Element): ScrapedTweet | null {
  try {
    // Get tweet text
    const textEl = getElement(tweetEl, 'tweetText');
    const text = textEl?.textContent?.trim() || '';
    
    // Skip if no meaningful text
    if (text.length < 10) return null;
    
    // Get tweet link and ID
    const linkEl = tweetEl.querySelector(SELECTORS.tweetLink) as HTMLAnchorElement | null;
    const url = linkEl?.href || '';
    const id = extractTweetId(url);
    if (!id) return null;
    
    // Get author info
    const userNameEl = tweetEl.querySelector(SELECTORS.userName);
    const authorName = userNameEl?.querySelector('span')?.textContent?.trim() || 'Unknown';
    
    // Extract handle from the link
    const handleLink = userNameEl?.querySelector('a[tabindex="-1"]') as HTMLAnchorElement | null;
    const authorHandle = handleLink?.href?.split('/').pop() || 'unknown';
    
    // Get timestamp
    const timeEl = tweetEl.querySelector(SELECTORS.timestamp);
    const timestamp = timeEl?.getAttribute('datetime') || new Date().toISOString();
    
    // Get metrics (optional)
    const metrics = extractMetrics(tweetEl);
    
    // Extract link context (GitHub, Twitter articles)
    const cleanedText = cleanTweetText(text);
    const links = extractLinksFromTweet(cleanedText);
    let linkContext = null;
    
    // Check if tweet has a link preview card (Twitter shows these in DOM)
    const linkPreview = tweetEl.querySelector('[data-testid="card"]');
    if (linkPreview) {
      const previewTitle = linkPreview.querySelector('h2, [data-testid="cardTitle"]')?.textContent?.trim();
      const previewDesc = linkPreview.querySelector('p, [data-testid="cardDescription"]')?.textContent?.trim();
      const previewLink = linkPreview.querySelector('a')?.href;
      
      if (previewLink && (isGitHubLink(previewLink) || isTwitterArticle(previewLink))) {
        // For GitHub links, we'll scrape the README
        if (isGitHubLink(previewLink)) {
          // Scrape will happen asynchronously, but we'll mark it here
          linkContext = {
            type: 'github' as const,
            url: previewLink,
            title: previewTitle || '',
            content: previewDesc || previewTitle || '',
            extractedAt: new Date().toISOString(),
          };
        } else {
          linkContext = {
            type: 'twitter_article' as const,
            url: previewLink,
            title: previewTitle,
            content: previewDesc || previewTitle || '',
            extractedAt: new Date().toISOString(),
          };
        }
      }
    }
    
    // If no preview card, try to extract from links in text
    if (!linkContext && links.length > 0) {
      for (const link of links) {
        if (isGitHubLink(link) || isTwitterArticle(link)) {
          // Mark that we found a link - actual scraping will happen async
          linkContext = {
            type: (isGitHubLink(link) ? 'github' : 'twitter_article') as 'github' | 'twitter_article',
            url: link,
            content: `Link found: ${link}`,
            extractedAt: new Date().toISOString(),
          };
          break;
        }
      }
    }
    
    return {
      id,
      text: cleanedText,
      authorHandle,
      authorName,
      url,
      timestamp,
      metrics,
      scrapedAt: new Date().toISOString(),
      linkContext: linkContext || undefined,
    };
  } catch (error) {
    console.error('[X-Bookmark] Error extracting tweet:', error);
    return null;
  }
}

/**
 * Clean tweet text by removing UI artifacts
 */
function cleanTweetText(text: string): string {
  return text
    // Remove common UI text
    .replace(/Show more|Show less|Translate Tweet|Translate/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract all visible tweets from the page
 */
export function extractVisibleTweets(): ScrapedTweet[] {
  const tweetElements = getAllElements(document, 'tweet');
  const tweets: ScrapedTweet[] = [];
  
  for (const el of tweetElements) {
    const tweet = extractTweetData(el);
    if (tweet) {
      tweets.push(tweet);
    }
  }
  
  return tweets;
}

/**
 * Scroll the page smoothly
 */
async function smoothScroll(): Promise<void> {
  return new Promise((resolve) => {
    const currentScroll = window.scrollY;
    const targetScroll = currentScroll + window.innerHeight * 0.8;
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
    
    // Wait for scroll to complete
    setTimeout(resolve, 800);
  });
}

/**
 * Wait for new content to load
 */
async function waitForLoad(timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkLoading = () => {
      const loader = document.querySelector(SELECTORS.loadingIndicator);
      const endState = document.querySelector(SELECTORS.endOfList);
      
      if (endState) {
        resolve(false); // Reached end
        return;
      }
      
      if (!loader && Date.now() - startTime > 500) {
        resolve(true); // Content loaded
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        resolve(true); // Timeout, continue anyway
        return;
      }
      
      requestAnimationFrame(checkLoading);
    };
    
    checkLoading();
  });
}

export interface ScrapeProgress {
  count: number;
  status: string;
}

export type ProgressCallback = (progress: ScrapeProgress) => void;

/**
 * Scrape all bookmarks by scrolling through the page
 * @param maxTweets - Maximum number of tweets to scrape (for testing). Set to 0 for unlimited.
 * @param processedIds - Set of tweet IDs to skip (already processed)
 */
export async function scrapeAllBookmarks(
  onProgress: ProgressCallback,
  signal?: AbortSignal,
  maxTweets: number = 10, // DEFAULT TO 10 FOR TESTING - change to 0 for unlimited
  processedIds: Set<string> = new Set(),
): Promise<ScrapedTweet[]> {
  const tweets = new Map<string, ScrapedTweet>();
  let previousCount = 0;
  let staleIterations = 0;
  let skippedCount = 0;
  const MAX_STALE_ITERATIONS = 3;

  const skipMsg = processedIds.size > 0 ? ` (skipping ${processedIds.size} already processed)` : '';
  onProgress({ count: 0, status: `Starting scan...${skipMsg}` });
  
  // Scroll to top first
  window.scrollTo({ top: 0, behavior: 'instant' });
  await new Promise(r => setTimeout(r, 500));
  
  while (staleIterations < MAX_STALE_ITERATIONS) {
    // Check for abort
    if (signal?.aborted) {
      onProgress({ count: tweets.size, status: 'Scan cancelled' });
      break;
    }
    
    // Check if we've reached the limit
    if (maxTweets > 0 && tweets.size >= maxTweets) {
      onProgress({ count: tweets.size, status: `Reached test limit of ${maxTweets} bookmarks` });
      break;
    }
    
    // Extract visible tweets
    const visible = extractVisibleTweets();
    for (const tweet of visible) {
      // Skip already processed tweets
      if (processedIds.has(tweet.id)) {
        skippedCount++;
        continue;
      }
      if (!tweets.has(tweet.id)) {
        tweets.set(tweet.id, tweet);
        // Stop if we hit the limit
        if (maxTweets > 0 && tweets.size >= maxTweets) {
          break;
        }
      }
    }

    // Update progress
    const skippedMsg = skippedCount > 0 ? ` (${skippedCount} skipped)` : '';
    onProgress({
      count: tweets.size,
      status: `Found ${tweets.size} new bookmarks...${skippedMsg}`
    });
    
    // Check if we've reached the limit after extraction
    if (maxTweets > 0 && tweets.size >= maxTweets) {
      onProgress({ count: tweets.size, status: `Test limit reached: ${maxTweets} bookmarks` });
      break;
    }
    
    // Check if we got new tweets
    if (tweets.size === previousCount) {
      staleIterations++;
      onProgress({ 
        count: tweets.size, 
        status: staleIterations < MAX_STALE_ITERATIONS 
          ? 'Checking for more...' 
          : 'Finishing up...'
      });
    } else {
      staleIterations = 0;
      previousCount = tweets.size;
    }
    
    // Scroll down
    await smoothScroll();
    
    // Wait for new content
    const hasMore = await waitForLoad();
    if (!hasMore) {
      onProgress({ count: tweets.size, status: 'Reached end of bookmarks' });
      break;
    }
  }
  
  onProgress({ count: tweets.size, status: 'Scan complete!' });
  
  // Enrich tweets with GitHub README content
  const tweetArray = Array.from(tweets.values());
  onProgress({ count: tweetArray.length, status: 'Fetching GitHub READMEs...' });
  
  const enrichedTweets = await Promise.all(
    tweetArray.map(async (tweet) => {
      // If tweet has a GitHub link but no full content yet, scrape it
      if (tweet.linkContext?.type === 'github' && tweet.linkContext.content.includes('Link found')) {
        const links = extractLinksFromTweet(tweet.text);
        for (const link of links) {
          if (isGitHubLink(link)) {
            const scraped = await scrapeGitHub(link);
            if (scraped) {
              return {
                ...tweet,
                linkContext: scraped,
              };
            }
          }
        }
      }
      return tweet;
    })
  );
  
  onProgress({ count: enrichedTweets.length, status: 'Enrichment complete!' });
  return enrichedTweets;
}
