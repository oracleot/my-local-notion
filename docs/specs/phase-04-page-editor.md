# Phase 4 — Page Editor

- [x] **4.1** Create `src/components/editor/page-header.tsx`
  - Large editable title input
  - Emoji icon picker (hover to reveal "Add icon" button)
  - Saves to Dexie on change
- [x] **4.2** Create `src/components/editor/page-editor.tsx`
  - Loads `page.content` from Dexie via `useLiveQuery`
  - Passes content as `initialContent` to `useCreateBlockNote`
  - `<BlockNoteView>` from `@blocknote/shadcn` with `style.css` import
  - `onChange` → debounced save of `editor.document` to Dexie
  - **Key behavior**: use `key={pageId}` on the editor component to force remount on page switch (BlockNote is uncontrolled)
- [x] **4.3** Wire up page route
  - `/page/:pageId` renders `<PageHeader>` + `<PageEditor>` or `<KanbanBoard>` based on `page.pageType`
