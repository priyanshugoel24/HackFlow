import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export default async function SafeMarkdown({ content, className = '' }: SafeMarkdownProps) {
  const sanitizedHtml = DOMPurify.sanitize(await marked.parse(content));

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
