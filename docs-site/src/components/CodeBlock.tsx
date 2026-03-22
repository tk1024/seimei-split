interface CodeBlockProps {
  children: string;
  language?: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <pre className="rounded-lg p-4 text-sm leading-relaxed overflow-x-auto font-mono"
      style={{ backgroundColor: "var(--code-bg)", color: "var(--code-text)" }}>
      <code>{children}</code>
    </pre>
  );
}
