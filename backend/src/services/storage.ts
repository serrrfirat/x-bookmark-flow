import Database from 'better-sqlite3';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { ClusterResult, ScrapedTweet, ThreadDraft } from '../../../shared/src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../../data/bookmarks.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    total_bookmarks INTEGER NOT NULL,
    clusters_count INTEGER NOT NULL,
    processing_time_ms INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clusters (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    label TEXT NOT NULL,
    summary TEXT NOT NULL,
    insights TEXT NOT NULL,
    post_content TEXT,
    post_sources TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    cluster_id TEXT NOT NULL,
    author_handle TEXT NOT NULL,
    author_name TEXT NOT NULL,
    text TEXT NOT NULL,
    url TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    link_url TEXT,
    link_title TEXT,
    link_content TEXT,
    FOREIGN KEY (cluster_id) REFERENCES clusters(id)
  );

  CREATE INDEX IF NOT EXISTS idx_clusters_session ON clusters(session_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_cluster ON bookmarks(cluster_id);
`);

export interface SaveSessionResult {
  sessionId: string;
}

/**
 * Save a processing session with all clusters and bookmarks
 */
export function saveSession(
  clusters: ClusterResult[],
  meta: { totalTweets: number; clustersGenerated: number; processingTimeMs: number }
): SaveSessionResult {
  const sessionId = `session-${Date.now()}`;
  const now = new Date().toISOString();

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, created_at, total_bookmarks, clusters_count, processing_time_ms)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertCluster = db.prepare(`
    INSERT INTO clusters (id, session_id, label, summary, insights, post_content, post_sources, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBookmark = db.prepare(`
    INSERT INTO bookmarks (id, cluster_id, author_handle, author_name, text, url, timestamp, link_url, link_title, link_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertSession.run(
      sessionId,
      now,
      meta.totalTweets,
      meta.clustersGenerated,
      meta.processingTimeMs
    );

    for (const cluster of clusters) {
      const clusterId = `${sessionId}-${cluster.id}`;

      insertCluster.run(
        clusterId,
        sessionId,
        cluster.label,
        cluster.summary,
        JSON.stringify(cluster.insights),
        cluster.thread?.tweets?.[0] || null,
        cluster.thread?.sources ? JSON.stringify(cluster.thread.sources) : null,
        now
      );

      for (const tweet of cluster.tweets) {
        insertBookmark.run(
          `${clusterId}-${tweet.id}`,
          clusterId,
          tweet.authorHandle,
          tweet.authorName,
          tweet.text,
          tweet.url,
          tweet.timestamp,
          tweet.linkContext?.url || null,
          tweet.linkContext?.title || null,
          tweet.linkContext?.content || null
        );
      }
    }
  });

  transaction();

  console.log(`💾 Saved session ${sessionId} with ${clusters.length} clusters`);
  return { sessionId };
}

/**
 * Get all sessions (metadata only)
 */
export function getSessions(): Array<{
  id: string;
  createdAt: string;
  totalBookmarks: number;
  clustersCount: number;
  processingTimeMs: number;
}> {
  const stmt = db.prepare(`
    SELECT id, created_at, total_bookmarks, clusters_count, processing_time_ms
    FROM sessions
    ORDER BY created_at DESC
  `);

  return stmt.all().map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    totalBookmarks: row.total_bookmarks,
    clustersCount: row.clusters_count,
    processingTimeMs: row.processing_time_ms,
  }));
}

/**
 * Get a specific session with all clusters and bookmarks
 */
export function getSession(sessionId: string): {
  session: { id: string; createdAt: string; totalBookmarks: number; clustersCount: number };
  clusters: ClusterResult[];
} | null {
  const sessionStmt = db.prepare(`
    SELECT id, created_at, total_bookmarks, clusters_count
    FROM sessions WHERE id = ?
  `);
  const session = sessionStmt.get(sessionId) as any;

  if (!session) return null;

  const clustersStmt = db.prepare(`
    SELECT id, label, summary, insights, post_content, post_sources, created_at
    FROM clusters WHERE session_id = ?
  `);
  const clusterRows = clustersStmt.all(sessionId) as any[];

  const bookmarksStmt = db.prepare(`
    SELECT id, author_handle, author_name, text, url, timestamp, link_url, link_title, link_content
    FROM bookmarks WHERE cluster_id = ?
  `);

  const clusters: ClusterResult[] = clusterRows.map((row) => {
    const bookmarkRows = bookmarksStmt.all(row.id) as any[];

    const tweets: ScrapedTweet[] = bookmarkRows.map((b) => ({
      id: b.id,
      authorHandle: b.author_handle,
      authorName: b.author_name,
      text: b.text,
      url: b.url,
      timestamp: b.timestamp,
      scrapedAt: b.timestamp,
      linkContext: b.link_url ? {
        type: 'other' as const,
        url: b.link_url,
        title: b.link_title || undefined,
        content: b.link_content || '',
        extractedAt: b.timestamp,
      } : undefined,
    }));

    const thread: ThreadDraft | undefined = row.post_content ? {
      tweets: [row.post_content],
      tone: 'founder',
      generatedAt: row.created_at,
      sources: row.post_sources ? JSON.parse(row.post_sources) : undefined,
    } : undefined;

    return {
      id: row.id.replace(`${sessionId}-`, ''),
      label: row.label,
      summary: row.summary,
      tweets,
      tweetCount: tweets.length,
      insights: JSON.parse(row.insights),
      thread,
    };
  });

  return {
    session: {
      id: session.id,
      createdAt: session.created_at,
      totalBookmarks: session.total_bookmarks,
      clustersCount: session.clusters_count,
    },
    clusters,
  };
}

/**
 * Get the most recent session
 */
export function getLatestSession(): ReturnType<typeof getSession> {
  const sessions = getSessions();
  if (sessions.length === 0) return null;
  return getSession(sessions[0].id);
}

/**
 * Delete a session and all its data
 */
export function deleteSession(sessionId: string): boolean {
  const transaction = db.transaction(() => {
    // Get cluster IDs first
    const clusterIds = db.prepare(`SELECT id FROM clusters WHERE session_id = ?`)
      .all(sessionId) as any[];

    // Delete bookmarks for each cluster
    const deleteBookmarks = db.prepare(`DELETE FROM bookmarks WHERE cluster_id = ?`);
    for (const cluster of clusterIds) {
      deleteBookmarks.run(cluster.id);
    }

    // Delete clusters
    db.prepare(`DELETE FROM clusters WHERE session_id = ?`).run(sessionId);

    // Delete session
    const result = db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
    return result.changes > 0;
  });

  return transaction();
}

export { db };
