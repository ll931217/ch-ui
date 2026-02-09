import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Table2 } from "lucide-react";

interface TableListProps {
  tables: string[];
  selectedTable: string | null;
  onSelectTable: (table: string | null) => void;
  disabled?: boolean;
}

const TableList: React.FC<TableListProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 border-r-2">
      <div className="px-4 py-3 border-b-2 bg-muted/50">
        <h3 className="font-semibold text-sm">Tables</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {disabled ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Select a database to view tables
            </div>
          ) : (
            <>
              {/* Database-level scope option */}
              <button
                onClick={() => onSelectTable(null)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                  selectedTable === null
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Table2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">% (All)</span>
              </button>

              {/* Table options */}
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                    selectedTable === table
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Table2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{table}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TableList;
