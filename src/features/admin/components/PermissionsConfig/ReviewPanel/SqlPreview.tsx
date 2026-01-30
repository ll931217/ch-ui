import { Button } from "@/components/ui/button";
import { PendingChange } from "../types";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SqlPreviewProps {
  changes: PendingChange[];
}

export default function SqlPreview({ changes }: SqlPreviewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No SQL statements to preview
      </div>
    );
  }

  // Combine all SQL statements in order
  const allSqlStatements = changes.flatMap((change, changeIdx) =>
    change.sqlStatements.map((sql, sqlIdx) => ({
      sql,
      changeIdx,
      sqlIdx,
      changeName: change.entityName,
      changeType: change.type,
    }))
  );

  const handleCopy = (index: number, sql: string) => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedIndex(index);
      toast.success("SQL copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleCopyAll = () => {
    const allSql = allSqlStatements.map((s) => s.sql).join(";\n\n") + ";";
    navigator.clipboard.writeText(allSql).then(() => {
      toast.success("All SQL statements copied to clipboard");
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with copy all button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {allSqlStatements.length} SQL statement(s) ready to execute
        </div>
        <Button onClick={handleCopyAll} variant="outline" size="sm" className="gap-2">
          <Copy className="w-4 h-4" />
          Copy All
        </Button>
      </div>

      {/* SQL statements */}
      <div className="space-y-3">
        {allSqlStatements.map((item, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {/* Statement header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  #{idx + 1}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {item.changeType}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.changeName}
                </span>
              </div>
              <Button
                onClick={() => handleCopy(idx, item.sql)}
                variant="ghost"
                size="sm"
                className="gap-1"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* SQL statement */}
            <div className="bg-background border rounded p-3">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                {item.sql}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Execution order notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          <strong>Note:</strong> SQL statements will be executed in the order shown
          above. If any statement fails, execution will stop and no further changes will
          be applied.
        </p>
      </div>
    </div>
  );
}
