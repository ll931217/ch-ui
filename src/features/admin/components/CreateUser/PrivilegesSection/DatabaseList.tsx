import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Database } from "lucide-react";

interface DatabaseListProps {
  databases: string[];
  selectedDatabase: string | null;
  onSelectDatabase: (database: string | null) => void;
}

const DatabaseList: React.FC<DatabaseListProps> = ({
  databases,
  selectedDatabase,
  onSelectDatabase,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 border-r-2">
      <div className="px-4 py-3 border-b-2 bg-muted/50">
        <h3 className="font-semibold text-sm">Databases</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Global scope option */}
          <button
            onClick={() => onSelectDatabase(null)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
              selectedDatabase === null
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            <Database className="h-4 w-4 shrink-0" />
            <span className="truncate">% (All)</span>
          </button>

          {/* Database options */}
          {databases.map((db) => (
            <button
              key={db}
              onClick={() => onSelectDatabase(db)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                selectedDatabase === db
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <Database className="h-4 w-4 shrink-0" />
              <span className="truncate">{db}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DatabaseList;
