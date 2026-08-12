import ReactMarkdown from "react-markdown";

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      components={{
        // Headings — font-display at controlled sizes, no browser defaults
        h1: ({ children }) => (
          <p className="mb-2 font-display text-base font-medium tracking-tight text-foreground">
            {children}
          </p>
        ),
        h2: ({ children }) => (
          <p className="mb-2 font-display text-sm font-medium tracking-tight text-foreground">
            {children}
          </p>
        ),
        h3: ({ children }) => (
          <p className="mb-1.5 font-display text-sm font-medium text-foreground">
            {children}
          </p>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-3 text-sm leading-6 text-foreground last:mb-0">
            {children}
          </p>
        ),
        // Bold
        strong: ({ children }) => (
          <strong className="font-medium text-foreground">{children}</strong>
        ),
        // Italic
        em: ({ children }) => (
          <em className="italic text-foreground/80">{children}</em>
        ),
        // Unordered list — disc markers, accent-tinted via CSS
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 marker:text-accent/70 last:mb-0">
            {children}
          </ul>
        ),
        // Ordered list
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 marker:text-accent/70 last:mb-0">
            {children}
          </ol>
        ),
        // List item — works for both ul and ol via CSS list-item display
        li: ({ children }) => (
          <li className="text-sm leading-6 text-foreground">{children}</li>
        ),
        // Links — match design system accent, no blue browser default
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
