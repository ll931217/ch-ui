// src/features/workspace/explain/components/JsonView.tsx
import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { ExplainResult } from "@/types/common";
import { useTheme } from "@/components/common/theme-provider";
import { getMonacoTheme } from "../../editor/monacoThemes";

interface JsonViewProps {
  explainResult: ExplainResult;
}

export const JsonView: React.FC<JsonViewProps> = ({ explainResult }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const editorTheme = getMonacoTheme(theme);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value: JSON.stringify(
        explainResult.rawJson || explainResult.tree,
        null,
        2,
      ),
      language: "json",
      theme: editorTheme,
      readOnly: true,
      minimap: { enabled: true },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      folding: true,
    });

    editorRef.current = editor;

    // Cleanup
    return () => {
      editor.dispose();
    };
  }, [explainResult, theme]);

  return <div ref={containerRef} className="w-full h-full" />;
};
