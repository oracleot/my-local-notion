import { useState, useRef, useEffect, useCallback } from "react";
import { updatePageTitle, updatePageIcon } from "@/lib/db-helpers";
import type { Page } from "@/types";
import { FileText, LayoutGrid, SmilePlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Common emoji palette for quick icon picking
const EMOJI_OPTIONS = [
  "📄", "📝", "📋", "📌", "📎", "📂", "📁", "🗂️",
  "💡", "🔥", "⭐", "🎯", "🚀", "💻", "🛠️", "⚡",
  "📊", "📈", "🗓️", "✅", "❌", "🔖", "🏷️", "🎨",
  "🌱", "🧠", "💬", "📢", "🔍", "🔑", "🏠", "🎉",
];

interface PageHeaderProps {
  page: Page;
}

export function PageHeader({ page }: PageHeaderProps) {
  const [title, setTitle] = useState(page.title);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      updatePageTitle(page.id, newTitle);
    },
    [page.id]
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Blur to move focus to the editor below
        titleRef.current?.blur();
      }
    },
    []
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      updatePageIcon(page.id, emoji);
      setShowEmojiPicker(false);
    },
    [page.id]
  );

  const handleRemoveIcon = useCallback(() => {
    updatePageIcon(page.id, null);
    setShowEmojiPicker(false);
  }, [page.id]);

  const Icon = page.pageType === "kanban" ? LayoutGrid : FileText;

  return (
    <div className="mb-8">
      {/* Icon area */}
      <div className="group/icon relative mb-3">
        {page.icon ? (
          <button
            className="text-5xl leading-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Change icon"
          >
            {page.icon}
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex h-9 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground/40 opacity-0 transition-opacity group-hover/icon:opacity-100 hover:bg-foreground/[0.04] hover:text-muted-foreground/60 cursor-pointer"
                onClick={() => setShowEmojiPicker((v) => !v)}
              >
                <SmilePlus className="h-4 w-4" />
                <span>Add icon</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Add an emoji icon
            </TooltipContent>
          </Tooltip>
        )}

        {/* Emoji picker dropdown */}
        {showEmojiPicker && (
          <div
            ref={emojiRef}
            className="absolute top-full left-0 z-50 mt-1 w-72 rounded-lg border border-border bg-popover p-2 shadow-lg"
          >
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent cursor-pointer"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {page.icon && (
              <button
                className="mt-1.5 w-full rounded-md px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-accent cursor-pointer"
                onClick={handleRemoveIcon}
              >
                Remove icon
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editable title */}
      <textarea
        ref={titleRef}
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Untitled"
        rows={1}
        className="w-full resize-none overflow-hidden bg-transparent font-serif text-4xl font-bold leading-tight tracking-tight text-foreground/90 placeholder:text-foreground/20 outline-none"
      />

      {/* Page type indicator */}
      <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground/50">
        <Icon className="h-3.5 w-3.5" />
        <span className="capitalize">{page.pageType}</span>
      </div>
    </div>
  );
}
