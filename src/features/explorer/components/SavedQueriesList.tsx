import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, SearchX, RefreshCcw } from "lucide-react";
import { SavedQuery } from "@/types/common";

interface SavedQueriesListProps {
  queries: SavedQuery[];
  onQueryOpen: (query: SavedQuery) => void;
  onRefresh: () => void;
}

const SavedQueriesList: React.FC<SavedQueriesListProps> = ({
  queries,
  onQueryOpen,
  onRefresh,
}) => {
  const [searchValue, setSearchValue] = useState("");

  const filteredQueries = useMemo(() => {
    if (!searchValue) return queries;
    return queries.filter((query) =>
      query.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [queries, searchValue]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-3 border-b space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search saved queries"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 pr-9 py-2 w-full h-8 text-sm"
            />
            {searchValue && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSearchValue("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              >
                <SearchX className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button size="icon" variant="outline" onClick={onRefresh}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredQueries.length > 0 ? (
            filteredQueries.map((query) => (
              <div
                key={query.id}
                className="flex flex-col py-1 w-full"
                onClick={() => onQueryOpen(query)}
              >
                <div className="text-xs text-muted-foreground cursor-pointer hover:bg-muted-foreground/10 rounded-md p-2 w-full flex justify-between">
                  <span className="flex-1 truncate font-medium">
                    {query.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(query.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-muted-foreground text-xs text-center">
              {searchValue
                ? "No queries match your search"
                : "No saved queries found"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SavedQueriesList;
