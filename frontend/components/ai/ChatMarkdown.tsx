"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/**
 * Enterprise markdown renderer for AI chat responses.
 * All styling is mapped to the design-system tokens so AI prose never
 * visually outweighs system-of-record facts.
 */
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink-primary">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-ai underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-4 list-disc space-y-1 marker:text-ink-tertiary">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-4 list-decimal space-y-1 marker:text-ink-tertiary">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-semibold text-ink-primary first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-semibold text-ink-primary first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-2.5 text-sm font-medium text-ink-primary first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1.5 mt-2 text-[13px] font-medium text-ink-secondary first:mt-0">{children}</h4>,
  code: ({ className, children }) => {
    // Fenced code blocks carry a `language-*` class; everything else is inline code.
    const isFenced = /language-/.test(className ?? "");
    return (
      <code
        className={
          isFenced
            ? "font-mono text-[12px] leading-5"
            : "rounded border border-border bg-canvas px-1 py-0.5 font-mono text-[12px] text-ink-primary"
        }
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md border border-border bg-canvas p-3 text-[12px] leading-5 text-ink-primary">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-ai/40 pl-3 text-ink-secondary">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-md border border-border">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-canvas">{children}</thead>,
  th: ({ children }) => (
    <th className="px-2.5 py-1.5 text-left font-semibold text-ink-secondary">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border px-2.5 py-1.5 text-ink-primary">{children}</td>
  ),
  hr: () => <hr className="my-3 border-border" />,
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-6 text-ink-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}