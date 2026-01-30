import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingChange } from "../types";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface DiffViewProps {
  changes: PendingChange[];
}

export default function DiffView({ changes }: DiffViewProps) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending changes to review
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <Card key={change.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    change.type === "CREATE"
                      ? "default"
                      : change.type === "ALTER"
                        ? "secondary"
                        : change.type === "DROP"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {change.type}
                </Badge>
                <Badge variant="outline">{change.entityType}</Badge>
                <CardTitle className="text-base font-medium">
                  {change.entityName}
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(change.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Description */}
            <p className="text-sm text-muted-foreground">{change.description}</p>

            {/* Before/After State */}
            {(change.originalState || change.newState) && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Before */}
                {change.originalState && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      Before:
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(change.originalState, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Arrow */}
                {change.originalState && change.newState && (
                  <div className="flex items-center justify-center col-span-2">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}

                {/* After */}
                {change.newState && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      After:
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(change.newState, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SQL Preview */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                SQL Statements ({change.sqlStatements.length}):
              </div>
              <div className="bg-muted/50 rounded p-2 space-y-1">
                {change.sqlStatements.map((sql, idx) => (
                  <div key={idx} className="font-mono text-xs">
                    {sql}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
