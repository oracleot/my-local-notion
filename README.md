# My Local Notion

A local-first, browser-only Notion clone built with modern web technologies. Create documents and Kanban boards that persist entirely in your browser—no backend, no accounts, no cloud sync required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **📝 Rich Text Editor** — Notion-style block editing powered by BlockNote with full markdown support
- **📋 Kanban Boards** — Drag-and-drop task management with columns and cards
- **🗂️ Hierarchical Pages** — Organize pages in nested structures with unlimited depth
- **🔍 Fast Search** — Quick find any page with ⌘+K fuzzy search
- **🌓 Dark Mode** — Light, dark, and system theme support with no FOUC
- **💾 Local-First** — All data stored in IndexedDB, works completely offline
- **⌨️ Keyboard Shortcuts** — Navigate efficiently with keyboard-first design
- **🎨 Modern UI** — Clean, responsive interface built with shadcn/ui and Tailwind CSS

## 🚀 Quick Start

```bash
# Install dependencies (using pnpm)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

Visit `http://localhost:5173` to start using the app.

📖 **New to the app?** Check out the [User Guide](./USER_GUIDE.md) for a complete walkthrough with screenshots.

## 🛠️ Tech Stack

| Layer          | Library                      | Purpose                          |
| -------------- | ---------------------------- | -------------------------------- |
| Framework      | React 19 + TypeScript 5.9    | UI & type safety                 |
| Bundler        | Vite 7                       | Dev server & builds              |
| Styling        | Tailwind CSS v4 + shadcn/ui  | Utility-first CSS + components   |
| Block Editor   | BlockNote                    | Notion-like block editing        |
| Persistence    | Dexie 4 (IndexedDB)          | Client-side database             |
| Routing        | React Router v7              | SPA navigation                   |
| State          | Zustand 5                    | UI state management              |
| Drag & Drop    | @dnd-kit                     | Kanban drag-and-drop             |

## ⌨️ Keyboard Shortcuts

- `⌘+K` / `Ctrl+K` — Open search dialog
- `⌘+\` / `Ctrl+\` — Toggle sidebar
- `⌘+N` / `Ctrl+N` — Create new page
- `⌘+Shift+L` / `Ctrl+Shift+L` — Cycle theme (light/dark/system)

## 📁 Project Structure

```
src/
├── components/
│   ├── editor/         # BlockNote editor and page header
│   ├── kanban/         # Kanban board components
│   ├── layout/         # App shell and sidebar
│   ├── shared/         # Reusable components (search, breadcrumbs, etc.)
│   └── ui/             # shadcn/ui primitives
├── lib/
│   ├── db.ts           # Dexie database schema
│   ├── db-helpers.ts   # CRUD operations
│   └── utils.ts        # Utility functions
├── stores/
│   └── app-store.ts    # Zustand state management
└── types/
    └── index.ts        # TypeScript interfaces
```

## 💾 Data Model

All data is stored locally in IndexedDB using Dexie:

- **Pages** — Documents and Kanban boards with hierarchical relationships
- **Kanban Cards** — Task cards organized by columns
- **UI State** — Sidebar, theme, and active page preferences

See [SPEC.md](./SPEC.md) for detailed data model documentation.

## 🔒 Privacy

Your data never leaves your browser. Everything is stored in IndexedDB and persists across sessions. No telemetry, no analytics, no external requests.

## 🧪 Development

```bash
# Run linter
pnpm lint

# Type check
pnpm build  # TypeScript compilation runs before build
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

Built with [BlockNote](https://www.blocknotejs.org/), [shadcn/ui](https://ui.shadcn.com/), and other amazing open-source projects.

---

## 📚 Documentation

- [User Guide](./USER_GUIDE.md) — Complete walkthrough with screenshots
- [Technical Specification](./SPEC.md) — Architecture and implementation details
