# X Bookmark Flow

<img width="395" height="519" alt="image" src="https://github.com/user-attachments/assets/61ba6cc5-7685-4a4a-988c-b0f741f30618" />


Transform your X (Twitter) bookmarks into structured content using AI. Scan your bookmarks, group them by topic, and generate shareable Twitter posts or comprehensive research documents.

## Features

- **Smart Scraping** - Automatically scrolls through and extracts your bookmarks
- **AI Clustering** - Groups related tweets into 3-7 topics
- **Two Processing Modes**:
  - **Twitter Mode** - Creates shareable, conversational posts
  - **Research Mode** - Generates structured markdown docs about tools & resources
- **Link Research** - Fetches and analyzes GitHub READMEs and linked articles
- **Duplicate Detection** - Tracks processed bookmarks to avoid re-processing
- **Session History** - View and reload previous sessions

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Chrome browser

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/x-bookmark-flow.git
cd x-bookmark-flow

# Install dependencies
pnpm install

# Build the extension
pnpm build:ext

# Start the backend
pnpm dev:backend
```

### Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

### Usage

1. Navigate to [x.com/i/bookmarks](https://x.com/i/bookmarks)
2. Click the extension icon
3. Select your mode (Twitter Posts or Research Doc)
4. Click "Scan Bookmarks"
5. Wait for AI processing
6. Review and edit the generated content

## Project Structure

```
x-bookmark-flow/
├── extension/          # Chrome extension (React + TypeScript)
│   ├── src/
│   │   ├── popup/      # Extension popup UI
│   │   ├── content/    # Content script for scraping
│   │   └── background/ # Service worker
│   └── dist/           # Built extension
├── backend/            # Express API server
│   └── src/
│       ├── routes/     # API endpoints
│       └── services/   # Business logic + Claude Code integration
└── shared/             # Shared TypeScript types
```

## Development

```bash
# Run everything in dev mode
pnpm dev

# Or run separately:
pnpm dev:backend    # Start backend with hot reload
pnpm dev:ext        # Watch and rebuild extension

# Type checking
pnpm typecheck

# Build for production
pnpm build
```

After making changes, refresh the extension in `chrome://extensions`.

## How It Works

1. **Content Script** - Scrapes visible bookmarks from the X DOM
2. **Background Script** - Coordinates between popup and content script, persists state
3. **Backend API** - Receives bookmarks and orchestrates processing
4. **Claude Code Agent** - Analyzes bookmarks, researches links via WebFetch, generates content
5. **SQLite Storage** - Persists sessions for history viewing

## Processing Modes

### Twitter Mode
Creates shareable posts with:
- Conversational, lowercase tone
- Insights grouped by topic
- Links to tools and resources mentioned

### Research Mode
Generates structured markdown with:
- Category overviews
- Tool descriptions with features and use cases
- Comparisons and recommendations

## Configuration

The extension connects to `localhost:9999` by default. No API keys needed in the project - Claude Code uses your CLI authentication.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/process-bookmarks` | POST | Process bookmarks with AI |
| `/api/sessions` | GET | List all sessions |
| `/api/sessions/:id` | GET | Get specific session |
| `/api/events` | GET | SSE stream for agent activity |

## Troubleshooting

### Extension not working
1. Make sure you're on `x.com/i/bookmarks`
2. Check the backend is running (`http://localhost:9999/api/health`)
3. Look at browser console for errors

### Scraping issues
X occasionally updates their DOM. If scraping fails, check `extension/src/content/selectors.ts`.

### Claude Code errors
1. Make sure Claude Code CLI is installed: `claude --version`
2. Ensure you're authenticated: `claude auth status`

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Zustand
- **Backend**: Express, TypeScript, better-sqlite3
- **AI**: Claude Code SDK (`@anthropic-ai/claude-code`)
- **Build**: Vite, tsx

## License

MIT
