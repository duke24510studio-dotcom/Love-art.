// Tiny, dependency-free Markdown-subset renderer for our own blog content
// (## headings, "- " / "1. " lists, **bold**, --- rule, paragraphs). Renders
// to plain React elements — no dangerouslySetInnerHTML, since we always
// control this content ourselves.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export function renderSimpleMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const isListLine = (l: string) => /^-\s+/.test(l);
  const isOrderedLine = (l: string) => /^\d+\.\s+/.test(l);

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim() === "---") {
      blocks.push(<hr key={key++} className="my-6" style={{ borderColor: "#d8d0c0" }} />);
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      const k = key++;
      blocks.push(
        <h2 key={k} className="text-lg font-medium mt-8 mb-3" style={{ color: "#2d5a3d" }}>
          {renderInline(line.slice(3), `h-${k}`)}
        </h2>
      );
      i++;
      continue;
    }

    if (isListLine(line)) {
      const items: string[] = [];
      while (i < lines.length && isListLine(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ""));
        i++;
      }
      const k = key++;
      blocks.push(
        <ul key={k} className="list-disc pl-6 space-y-1 my-3">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ul-${k}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (isOrderedLine(line)) {
      const items: string[] = [];
      while (i < lines.length && isOrderedLine(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      const k = key++;
      blocks.push(
        <ol key={k} className="list-decimal pl-6 space-y-1 my-3">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `ol-${k}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("## ") &&
      lines[i].trim() !== "---" &&
      !isListLine(lines[i]) &&
      !isOrderedLine(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    const k = key++;
    blocks.push(
      <p key={k} className="leading-relaxed my-3">
        {renderInline(paraLines.join(" "), `p-${k}`)}
      </p>
    );
  }

  return <>{blocks}</>;
}
