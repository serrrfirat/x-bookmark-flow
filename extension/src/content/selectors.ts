/**
 * DOM Selectors for X/Twitter Bookmarks page
 * Abstracted for easy updates when X changes their DOM structure
 */

export const SELECTORS = {
  // Tweet containers
  tweet: '[data-testid="tweet"]',
  tweetArticle: 'article[role="article"]',
  
  // Tweet content
  tweetText: '[data-testid="tweetText"]',
  
  // User info
  userName: '[data-testid="User-Name"]',
  userHandle: '[data-testid="User-Name"] a[tabindex="-1"]',
  
  // Timestamp & link
  timestamp: 'time',
  tweetLink: 'a[href*="/status/"]',
  
  // Engagement metrics
  replyCount: '[data-testid="reply"]',
  retweetCount: '[data-testid="retweet"]',
  likeCount: '[data-testid="like"]',
  viewCount: 'a[href$="/analytics"]',
  
  // Scroll & loading
  timeline: '[data-testid="primaryColumn"]',
  scrollContainer: 'main[role="main"]',
  loadingIndicator: '[role="progressbar"]',
  endOfList: '[data-testid="emptyState"]',
  
  // Fallback selectors (when data-testid changes)
  fallback: {
    tweet: 'article[role="article"]',
    tweetText: '[lang]',
    userName: 'div[dir="ltr"] > span',
  },
};

/**
 * Get an element using primary selector with fallback
 */
export function getElement(
  parent: Element | Document,
  key: keyof typeof SELECTORS,
): Element | null {
  const primary = SELECTORS[key];
  if (typeof primary === 'string') {
    const element = parent.querySelector(primary);
    if (element) return element;
    
    // Try fallback if available
    const fallback = SELECTORS.fallback[key as keyof typeof SELECTORS.fallback];
    if (fallback) {
      return parent.querySelector(fallback);
    }
  }
  return null;
}

/**
 * Get all elements matching a selector
 */
export function getAllElements(
  parent: Element | Document,
  key: keyof typeof SELECTORS,
): Element[] {
  const primary = SELECTORS[key];
  if (typeof primary === 'string') {
    const elements = parent.querySelectorAll(primary);
    if (elements.length > 0) return Array.from(elements);
    
    // Try fallback
    const fallback = SELECTORS.fallback[key as keyof typeof SELECTORS.fallback];
    if (fallback) {
      return Array.from(parent.querySelectorAll(fallback));
    }
  }
  return [];
}

