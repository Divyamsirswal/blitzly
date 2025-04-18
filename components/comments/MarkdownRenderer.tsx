import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // Simple markdown parsing for comments
  const renderMarkdown = (text: string) => {
    // Replace markdown patterns with HTML
    let html = text;

    // Convert line breaks
    html = html.replace(/\n/g, "<br />");

    // Bold text: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic text: _text_ -> <em>text</em>
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Lists: - item -> <li>item</li>
    const lines = html.split("<br />");
    let inList = false;

    html = lines
      .map((line) => {
        if (line.trim().startsWith("- ")) {
          if (!inList) {
            inList = true;
            return `<ul class="list-disc pl-5 my-2"><li>${line
              .trim()
              .substring(2)}</li>`;
          } else {
            return `<li>${line.trim().substring(2)}</li>`;
          }
        } else if (inList) {
          inList = false;
          return `</ul>${line}`;
        } else {
          return line;
        }
      })
      .join("<br />");

    if (inList) {
      html += "</ul>";
    }

    // Links: [text](url) -> <a href="url">text</a>
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return html;
  };

  return (
    <div
      className={cn(
        "comment-content prose-sm prose-gray dark:prose-invert",
        className
      )}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
