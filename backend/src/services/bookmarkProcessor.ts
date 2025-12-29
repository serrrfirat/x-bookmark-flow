import { query } from '@anthropic-ai/claude-code';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import type { ScrapedTweet, ClusterResult, TonePreset, ProcessingMode } from '../../../shared/src/types';
import { saveSession } from './storage.js';
import { emitAgentEvent } from './agentEvents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');

// Load skill instructions at startup
const SKILL_PATH = resolve(PROJECT_ROOT, '.claude/skills/content-research-writer/SKILL.md');
let skillInstructions = '';
try {
  skillInstructions = readFileSync(SKILL_PATH, 'utf-8');
  console.log('✅ Loaded content-research-writer skill instructions');
} catch (e) {
  console.warn('⚠️ Could not load skill file, using fallback instructions');
}

export interface ProcessBookmarksResult {
  clusters: ClusterResult[];
  meta: {
    totalTweets: number;
    processedTweets: number;
    filteredTweets: number;
    clustersGenerated: number;
    processingTimeMs: number;
  };
}

/**
 * Format bookmarks for agent consumption
 */
function formatBookmarks(tweets: ScrapedTweet[]): string {
  return tweets.map((tweet, i) => {
    let text = `[${i + 1}] @${tweet.authorHandle}: "${tweet.text}"`;
    text += `\n    url: ${tweet.url}`;
    if (tweet.linkContext?.url) {
      text += `\n    link: ${tweet.linkContext.url}`;
      if (tweet.linkContext.title) {
        text += ` - ${tweet.linkContext.title}`;
      }
    }
    return text;
  }).join('\n\n');
}

/**
 * Build prompt for Twitter mode (creates shareable posts)
 */
function buildTwitterPrompt(bookmarksText: string): string {
  return `you are a content research writer. follow these skill instructions:

<skill-instructions>
${skillInstructions}
</skill-instructions>

## your task

analyze these bookmarks and create insightful content:

${bookmarksText}

## specific requirements

1. use WebFetch to research the external links (github repos, blog posts, articles - NOT the x.com tweet urls)
2. if WebFetch returns garbage (css/js), use WebSearch to find info about that topic instead
3. group bookmarks into 3-7 topics based on themes you discover
4. for each topic, write a single insightful post:
   - between 500 and 1000 words
   - all lowercase
   - follow the skill instructions
   - have paraghraphs that are 2-3 sentences each.
   - try to use bullet points where appropriate.
   - do not use too many words, try to be concise and to the point.
5. If the topic is about tools, make sure to include a link to the tool or the repository in the post.
6. If we are grouping multiple tools in one group, talk about how the tools are used and why they are important for this specific topic. Provide valuable insights not just a list of tools.

## Things to avoid:

- avoid patterns like "the secret isn't just volume - it's understanding platform behavior. "
- avoid "-"
- avoid using hashtags (#) anywhere in the post
- avoid using emojis anywhere in the post
- avoid "claud code isn't just another coding assistant -  it's a xxxx"
- avoid " this isn't just throwing ai at a problem. it's orchestrating intelligence." kind of 'this isnt just x, this is y' language.

## Tone of voice:

connect with readers through authentic and conversational content.
- use contractions
- vary sentence length dramatically
- add natural pauses
- add occasional tangents
- use relatable metaphors
- make content slightly messy
- include small asides, second thoughts or casual observations
- show you understand the reader

## CRITICAL: output format

you MUST return valid json in this exact format:

\`\`\`json
{
  "clusters": [
    {
      "id": "cluster-1",
      "label": "topic name",
      "summary": "what this topic is about...",
      "insights": ["insight 1", "insight 2", "insight 3"],
      "tweetIndices": [1, 3, 5],
      "post": {
        "content": "your insightful post here, all lowercase...",
        "sources": ["https://url1.com", "https://url2.com"]
      }
    }
  ]
}
\`\`\`

tweetIndices are the 1-based indices from the bookmarks list above.

IMPORTANT: your final response MUST contain the json block above. do not skip this step.`;
}

/**
 * Build prompt for Research mode (creates structured markdown doc about tools)
 */
function buildResearchPrompt(bookmarksText: string): string {
  return `you are a technical research writer. your task is to analyze bookmarked tools and resources and create a well-structured, comprehensive markdown document.

## your task

analyze these bookmarks and create a structured research document:

${bookmarksText}

## specific requirements

1. use WebFetch to research EVERY external link (github repos, blog posts, articles - NOT the x.com tweet urls)
2. if WebFetch returns garbage (css/js), use WebSearch to find detailed info about that tool/topic
3. group bookmarks into 3-7 categories based on themes (e.g., "AI Code Editors", "Automation Tools", "Content Creation", etc.)
4. for each category, create a comprehensive section that includes:
   - category overview explaining the problem space
   - for each tool in the category:
     - tool name and link
     - what it does (2-3 sentences)
     - key features (bullet points)
     - best use cases
     - any limitations or considerations
   - comparison insights between tools in the category
   - practical recommendations

## document structure

create a markdown document with:
- title: "Tools & Resources Research"
- date of research
- table of contents
- executive summary (key takeaways)
- detailed sections for each category
- conclusion with recommendations

## writing style

- clear and professional but accessible
- focus on practical utility
- include specific examples where possible
- be honest about limitations
- prioritize actionable insights over hype

## CRITICAL: output format

you MUST return valid json in this exact format:

\`\`\`json
{
  "clusters": [
    {
      "id": "cluster-1",
      "label": "category name",
      "summary": "overview of this category...",
      "insights": ["key insight 1", "key insight 2", "key insight 3"],
      "tweetIndices": [1, 3, 5],
      "post": {
        "content": "## Category Name\\n\\nFull markdown content for this section including tool descriptions, features, use cases, and recommendations...",
        "sources": ["https://github.com/tool1", "https://tool2.com"]
      }
    }
  ]
}
\`\`\`

tweetIndices are the 1-based indices from the bookmarks list above.
The "content" field should contain full markdown with headers, bullets, and links.

IMPORTANT: your final response MUST contain the json block above. do not skip this step.`;
}

/**
 * Process all bookmarks using Claude Code Agent with content-research-writer skill
 */
export async function processBookmarksWithAgent(
  tweets: ScrapedTweet[],
  tone: TonePreset = 'founder',
  mode: ProcessingMode = 'twitter'
): Promise<ProcessBookmarksResult> {
  const startTime = Date.now();

  console.log(`📚 Processing ${tweets.length} bookmarks (mode: ${mode})...`);

  // Format bookmarks for the agent
  const bookmarksText = formatBookmarks(tweets);

  // Build prompt based on mode
  const prompt = mode === 'research'
    ? buildResearchPrompt(bookmarksText)
    : buildTwitterPrompt(bookmarksText);

  try {
    const results: string[] = [];

    const modeLabel = mode === 'research' ? 'researching tools' : 'creating posts';
    emitAgentEvent('status', `${modeLabel} from ${tweets.length} bookmarks...`);

    for await (const message of query({
      prompt,
      options: {
        cwd: PROJECT_ROOT,
        maxTurns: 25,
        permissionMode: 'bypassPermissions', // Allow all tools without prompts
      }
    })) {
      // Handle different message types from the agent
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block) {
            results.push(block.text);
            // Emit text chunks (truncate for display)
            const preview = block.text.slice(0, 200);
            if (preview.trim()) {
              emitAgentEvent('text', preview.length < block.text.length ? preview + '...' : preview);
            }
          } else if ('type' in block && block.type === 'tool_use') {
            const toolBlock = block as { type: 'tool_use'; name: string; input: unknown };
            emitAgentEvent('tool_use', `using ${toolBlock.name}`, {
              tool: toolBlock.name,
              input: toolBlock.input
            });
          }
        }
      } else if (message.type === 'user' && message.message?.content) {
        // Tool results come back as user messages
        for (const block of message.message.content) {
          if ('type' in block && block.type === 'tool_result') {
            const resultBlock = block as { type: 'tool_result'; content: string };
            const preview = typeof resultBlock.content === 'string'
              ? resultBlock.content.slice(0, 150)
              : 'received data';
            emitAgentEvent('tool_result', preview.length < 150 ? preview : preview + '...');
          }
        }
      }
    }

    emitAgentEvent('status', 'parsing results...');

    const fullResponse = results.join('\n');
    console.log('📝 Raw agent response:', fullResponse.slice(0, 2000)); // Debug log
    const clusters = parseAgentResponse(fullResponse, tweets, tone);

    const processingTimeMs = Date.now() - startTime;
    console.log(`✅ Processed ${tweets.length} bookmarks into ${clusters.length} clusters in ${processingTimeMs}ms`);

    const meta = {
      totalTweets: tweets.length,
      processedTweets: tweets.length,
      filteredTweets: 0,
      clustersGenerated: clusters.length,
      processingTimeMs,
    };

    // Save to database
    const { sessionId } = saveSession(clusters, meta);
    console.log(`💾 Saved as session: ${sessionId}`);

    emitAgentEvent('complete', `created ${clusters.length} topics from ${tweets.length} bookmarks`);

    return { clusters, meta };
  } catch (error) {
    console.error('❌ Error processing bookmarks:', error);
    emitAgentEvent('error', error instanceof Error ? error.message : 'unknown error');
    throw error;
  }
}

/**
 * Parse the agent's response and construct ClusterResult[]
 */
function parseAgentResponse(
  response: string,
  originalTweets: ScrapedTweet[],
  tone: TonePreset
): ClusterResult[] {
  // Extract JSON from the response
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    const rawJsonMatch = response.match(/\{[\s\S]*"clusters"[\s\S]*\}/);
    if (!rawJsonMatch) {
      console.error('Could not find JSON in response');
      return createFallbackClusters(originalTweets, tone);
    }
    return parseJsonClusters(rawJsonMatch[0], originalTweets, tone);
  }

  return parseJsonClusters(jsonMatch[1], originalTweets, tone);
}

function parseJsonClusters(
  jsonStr: string,
  originalTweets: ScrapedTweet[],
  tone: TonePreset
): ClusterResult[] {
  try {
    const parsed = JSON.parse(jsonStr);

    if (!parsed.clusters || !Array.isArray(parsed.clusters)) {
      throw new Error('Invalid clusters format');
    }

    return parsed.clusters.map((cluster: any, index: number) => {
      const tweetIndices = cluster.tweetIndices || [];
      const clusterTweets = tweetIndices
        .map((i: number) => originalTweets[i - 1])
        .filter(Boolean);

      const assignedTweets = clusterTweets.length > 0
        ? clusterTweets
        : originalTweets.slice(index * 3, (index + 1) * 3);

      // Handle both old "thread" format and new "post" format
      const postContent = cluster.post?.content || cluster.thread?.tweets?.[0] || '';
      const sources = cluster.post?.sources || cluster.thread?.sources || [];

      return {
        id: cluster.id || `cluster-${index + 1}`,
        label: cluster.label || `topic ${index + 1}`,
        summary: cluster.summary || '',
        tweets: assignedTweets,
        tweetCount: assignedTweets.length,
        insights: cluster.insights || [],
        thread: {
          tweets: [postContent],
          tone,
          generatedAt: new Date().toISOString(),
          sources,
        },
      };
    });
  } catch (error) {
    console.error('Error parsing JSON clusters:', error);
    return createFallbackClusters(originalTweets, tone);
  }
}

/**
 * Create fallback clusters if parsing fails
 */
function createFallbackClusters(
  tweets: ScrapedTweet[],
  tone: TonePreset
): ClusterResult[] {
  const clusters: ClusterResult[] = [];
  const chunkSize = Math.max(5, Math.ceil(tweets.length / 5));

  for (let i = 0; i < tweets.length; i += chunkSize) {
    const chunk = tweets.slice(i, i + chunkSize);
    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      label: `topic ${clusters.length + 1}`,
      summary: `collection of ${chunk.length} bookmarks`,
      tweets: chunk,
      tweetCount: chunk.length,
      insights: ['processing failed - manual review needed'],
      thread: {
        tweets: [`found ${chunk.length} interesting bookmarks to review.`],
        tone,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  return clusters;
}
