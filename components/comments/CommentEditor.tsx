import { useState, useRef, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Bold,
  Italic,
  List,
  Smile,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_COMMENT_LENGTH = 1000;
// Organized emojis by category for better UX
const EMOJIS = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
  ],
  gestures: ["👍", "👎", "👏", "🙌", "🤝", "👊", "✌️", "🤞", "🤟", "🤘", "💪"],
  objects: ["💯", "💢", "💥", "💫", "💦", "💨", "🔥", "✨", "🎉", "🎊", "🎈"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔"],
};

interface CommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
}

const CommentEditor = forwardRef<HTMLTextAreaElement, CommentEditorProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      isSubmitting,
      placeholder = "Add a comment...",
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [charCount, setCharCount] = useState(0);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [selectedEmojiCategory, setSelectedEmojiCategory] =
      useState<keyof typeof EMOJIS>("smileys");
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);

    // Use either passed ref or internal ref
    const textareaRef = (ref ||
      internalTextareaRef) as React.RefObject<HTMLTextAreaElement>;

    useEffect(() => {
      setCharCount(value.length);
    }, [value]);

    // Focus textarea when component mounts
    useEffect(() => {
      // Short delay to ensure proper focus
      const timer = setTimeout(() => {
        if (textareaRef.current && !value) {
          textareaRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [textareaRef, value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (value.trim() && !isSubmitting && charCount <= MAX_COMMENT_LENGTH) {
          onSubmit();
        }
      }

      // Bold with Ctrl+B
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        insertFormatting("bold");
      }

      // Italic with Ctrl+I
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        insertFormatting("italic");
      }
    };

    const insertFormatting = (format: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let newText = "";
      let newCursorPos = 0;

      switch (format) {
        case "bold":
          newText =
            value.substring(0, start) +
            `**${selectedText || "bold text"}**` +
            value.substring(end);
          newCursorPos = selectedText ? end + 4 : start + 10;
          break;
        case "italic":
          newText =
            value.substring(0, start) +
            `_${selectedText || "italic text"}_` +
            value.substring(end);
          newCursorPos = selectedText ? end + 2 : start + 12;
          break;
        case "list":
          if (selectedText) {
            // Add '- ' to the beginning of each line
            const formattedText = selectedText
              .split("\n")
              .map((line) => `- ${line}`)
              .join("\n");
            newText =
              value.substring(0, start) + formattedText + value.substring(end);
            newCursorPos = start + formattedText.length;
          } else {
            newText = value.substring(0, start) + "- " + value.substring(end);
            newCursorPos = start + 2;
          }
          break;
        case "link":
          if (linkText && linkUrl) {
            newText =
              value.substring(0, start) +
              `[${linkText}](${linkUrl})` +
              value.substring(end);
            newCursorPos = start + linkText.length + linkUrl.length + 4;
            // Reset link inputs
            setLinkText("");
            setLinkUrl("");
            setShowLinkInput(false);
          }
          break;
        default:
          return;
      }

      onChange(newText);

      // Set cursor position after formatting is inserted
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    };

    const insertEmoji = (emoji: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newText = value.substring(0, start) + emoji + value.substring(end);

      onChange(newText);

      // Close emoji picker
      setEmojiOpen(false);

      // Set cursor position after emoji
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + emoji.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    };

    const handleLinkInsert = () => {
      insertFormatting("link");
    };

    return (
      <div
        className={cn(
          "border rounded-lg transition-all duration-200",
          isFocused
            ? "border-blue-500 dark:border-blue-400 shadow-md ring-1 ring-blue-200 dark:ring-blue-900"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="resize-none focus-visible:ring-0 focus-visible:ring-offset-0 border-0 min-h-[100px] max-h-[300px] transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        {isFocused && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          value.includes("**") &&
                            "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                        )}
                        onClick={() => insertFormatting("bold")}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>Bold (Ctrl+B)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          value.includes("_") &&
                            "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                        )}
                        onClick={() => insertFormatting("italic")}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>Italic (Ctrl+I)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          value.includes("- ") &&
                            "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                        )}
                        onClick={() => insertFormatting("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>List</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          showLinkInput &&
                            "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                        )}
                        onClick={() => setShowLinkInput(!showLinkInput)}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>Add Link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>Add Emoji</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <PopoverContent
                    className="w-64 p-2 border border-gray-200 dark:border-gray-700 shadow-md"
                    align="start"
                    sideOffset={5}
                  >
                    <div className="space-y-2">
                      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                        {Object.keys(EMOJIS).map((category) => (
                          <Button
                            key={category}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-2 py-1 rounded text-xs",
                              selectedEmojiCategory === category
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400"
                            )}
                            onClick={() =>
                              setSelectedEmojiCategory(
                                category as keyof typeof EMOJIS
                              )
                            }
                          >
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS[selectedEmojiCategory].map((emoji, index) => (
                          <button
                            key={index}
                            className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => insertEmoji(emoji)}
                          >
                            <span className="text-lg">{emoji}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "text-xs transition-colors",
                    charCount > MAX_COMMENT_LENGTH
                      ? "text-red-500"
                      : charCount > MAX_COMMENT_LENGTH * 0.8
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {charCount}/{MAX_COMMENT_LENGTH}
                </div>

                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={
                    isSubmitting ||
                    !value.trim() ||
                    charCount > MAX_COMMENT_LENGTH
                  }
                  size="sm"
                  className={cn(
                    "transition-all duration-200",
                    isSubmitting
                      ? "bg-blue-400 dark:bg-blue-500"
                      : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                      Posting...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Post
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Link Input Section */}
            {showLinkInput && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex flex-col sm:flex-row gap-2 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Link text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="URL"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleLinkInsert}
                  disabled={!linkText || !linkUrl}
                  size="sm"
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Insert
                </Button>
              </div>
            )}
          </>
        )}

        {value && !isFocused && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex justify-between items-center">
            <div
              className={cn(
                "text-xs transition-colors",
                charCount > MAX_COMMENT_LENGTH
                  ? "text-red-500"
                  : charCount > MAX_COMMENT_LENGTH * 0.8
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {charCount}/{MAX_COMMENT_LENGTH}
            </div>

            <div className="flex gap-2">
              {value.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange("")}
                  className="h-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>
              )}

              <Button
                type="button"
                onClick={onSubmit}
                disabled={
                  isSubmitting ||
                  !value.trim() ||
                  charCount > MAX_COMMENT_LENGTH
                }
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                    Posting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Post
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CommentEditor.displayName = "CommentEditor";

export default CommentEditor;
