import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, BookmarkIcon } from "lucide-react";

interface ExplorerTabsProps {
  mainContent: React.ReactNode;
  queriesContent: React.ReactNode;
}

const ExplorerTabs: React.FC<ExplorerTabsProps> = ({
  mainContent,
  queriesContent,
}) => {
  return (
    <Tabs defaultValue="main" className="flex flex-col h-full">
      <TabsList className="w-full grid grid-cols-2 rounded-none">
        <TabsTrigger value="main" className="gap-2">
          <Database className="w-4 h-4" />
          <span>Main</span>
        </TabsTrigger>
        <TabsTrigger value="queries" className="gap-2">
          <BookmarkIcon className="w-4 h-4" />
          <span>Queries</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="main" className="flex-1 m-0 min-h-0 overflow-auto">
        {mainContent}
      </TabsContent>

      <TabsContent value="queries" className="flex-1 m-0 min-h-0 overflow-auto">
        {queriesContent}
      </TabsContent>
    </Tabs>
  );
};

export default ExplorerTabs;
