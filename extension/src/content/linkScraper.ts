import type { LinkContext } from '../../../shared/src/types';

/**
 * Extract all links from tweet text
 */
export function extractLinksFromTweet(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

/**
 * Check if a URL is a GitHub link
 */
export function isGitHubLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com';
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a Twitter article
 */
export function isTwitterArticle(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.hostname === 'x.com' || parsed.hostname === 'twitter.com') 
      && parsed.pathname.includes('/i/web/');
  } catch {
    return false;
  }
}

/**
 * Scrape GitHub repository README
 */
export async function scrapeGitHub(url: string): Promise<LinkContext | null> {
  try {
    // Extract repo info from URL
    // Handles: github.com/owner/repo, github.com/owner/repo/tree/branch, github.com/owner/repo/blob/branch/path
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/(?:blob|tree)\/([^\/]+)(?:\/(.+))?)?/);
    if (!match) return null;
    
    const [, owner, repo, branch = 'main', path] = match;
    
    // If it's a specific file path, skip README scraping
    if (path && !path.toLowerCase().includes('readme')) {
      return {
        type: 'github',
        url,
        title: `${owner}/${repo}/${path}`,
        content: `GitHub file: ${owner}/${repo}/${path}`,
        extractedAt: new Date().toISOString(),
      };
    }
    
    // Try to fetch README from raw.githubusercontent.com
    // Try common branch names and README filenames
    const branches = [branch, 'main', 'master', 'develop'];
    const readmeNames = ['README.md', 'README.txt', 'README', 'readme.md'];
    
    let readmeContent = '';
    let readmeTitle = '';
    
    for (const tryBranch of branches) {
      for (const readmeName of readmeNames) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${tryBranch}/${readmeName}`;
          const response = await fetch(rawUrl);
          
          if (response.ok) {
            readmeContent = await response.text();
            readmeTitle = `${owner}/${repo} - ${readmeName}`;
            break;
          }
        } catch (e) {
          // Try next combination
          continue;
        }
      }
      if (readmeContent) break;
    }
    
    // Clean up README content
    if (readmeContent) {
      // Remove markdown code blocks but keep content
      readmeContent = readmeContent
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
        .replace(/#{1,6}\s+/g, '') // Remove markdown headers
        .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim()
        .slice(0, 3000); // Limit to 3000 chars
    }
    
    return {
      type: 'github',
      url,
      title: readmeTitle || `${owner}/${repo}`,
      content: readmeContent || `GitHub repository: ${owner}/${repo}`,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[X-Bookmark] Error scraping GitHub:', error);
    return null;
  }
}

/**
 * Scrape Twitter article content
 */
export async function scrapeTwitterArticle(url: string): Promise<LinkContext | null> {
  try {
    // Twitter articles are accessible from the same domain
    // We can navigate to them and scrape
    const response = await fetch(url, {
      credentials: 'include', // Use logged-in session
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract article content
    // Twitter articles have specific structure - adjust selectors as needed
    const titleEl = doc.querySelector('h1, [data-testid="article-title"]');
    const contentEl = doc.querySelector('article, [data-testid="article-content"]');
    
    const title = titleEl?.textContent?.trim() || '';
    const content = contentEl?.textContent?.trim() || '';
    
    if (!content) return null;
    
    return {
      type: 'twitter_article',
      url,
      title,
      content: content.slice(0, 2000), // Limit content length
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[X-Bookmark] Error scraping Twitter article:', error);
    return null;
  }
}

/**
 * Scrape link content based on type
 */
export async function scrapeLink(url: string): Promise<LinkContext | null> {
  if (isGitHubLink(url)) {
    return scrapeGitHub(url);
  } else if (isTwitterArticle(url)) {
    return scrapeTwitterArticle(url);
  }
  return null;
}

/**
 * Extract and scrape all relevant links from a tweet
 */
export async function extractLinkContext(text: string): Promise<LinkContext | null> {
  const links = extractLinksFromTweet(text);
  
  // Find first GitHub or Twitter article link
  for (const link of links) {
    if (isGitHubLink(link) || isTwitterArticle(link)) {
      const context = await scrapeLink(link);
      if (context) return context;
    }
  }
  
  return null;
}
