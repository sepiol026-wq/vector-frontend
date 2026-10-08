"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

type HighlighterProps = ComponentProps<
  typeof import("react-syntax-highlighter").Prism
>;

export default function CodeBlock({
  code,
  language,
  label,
}: {
  code: string;
  language: string;
  label: string;
}) {
  const [Highlighter, setHighlighter] =
    useState<React.ComponentType<HighlighterProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [mod, style] = await Promise.all([
          import("react-syntax-highlighter"),
          import(
            "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus"
          ),
        ]);
        if (cancelled) return;
        const Prism = mod.Prism;
        setHighlighter(
          () =>
            (props: HighlighterProps) =>
              <Prism {...props} style={style.default} />,
        );
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = code.split("\n");

  if (failed || !Highlighter) {
    return (
      <pre
        className="code-block"
        aria-label={label}
        style={{
          overflow: "auto",
          maxHeight: "74vh",
          padding: "18px",
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.7,
          color: "#e2e8f0",
          fontFamily:
            '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
          background:
            "linear-gradient(180deg, rgba(0,0,0,.9), rgba(0,0,0,.7))",
        }}
      >
        <code>
          {lines.map((line, i) => (
            <div key={i} className="code-line">
              <span className="code-ln">{i + 1}</span>
              <span>{line || " "}</span>
            </div>
          ))}
        </code>
        <style>{`
          .code-line { display: flex; line-height: 1.7; font-size: 13px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
          .code-ln { flex: 0 0 3.5em; text-align: right; padding-right: 1.25em; color: #64748b; font-size: 12px; user-select: none; }
        `}</style>
      </pre>
    );
  }

  return (
    <Highlighter
      aria-label={label}
      className="code-block"
      codeTagProps={{
        style: {
          fontFamily:
            '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
        },
      }}
      customStyle={{
        margin: 0,
        maxHeight: "74vh",
        overflow: "auto",
        padding: "18px",
        background:
          "linear-gradient(180deg, rgba(0,0,0,.9), rgba(0,0,0,.7))",
        fontSize: "13px",
        lineHeight: 1.7,
      }}
      language={language}
      lineNumberStyle={{
        color: "#64748b",
        fontSize: "12px",
        minWidth: "3.5em",
        paddingRight: "1.25em",
      }}
      PreTag="div"
      showLineNumbers
      wrapLongLines={false}
    >
      {code}
    </Highlighter>
  );
}
