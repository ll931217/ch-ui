import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAppStore from "@/store";

const DatabaseSelector: React.FC = () => {
  const { dataBaseExplorer, selectedDatabase, setSelectedDatabase } =
    useAppStore();

  const databases = dataBaseExplorer.map((db) => db.name);

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={selectedDatabase || "all"}
        onValueChange={(value) => {
          setSelectedDatabase(value === "all" ? null : value);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select database" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Databases</SelectItem>
          {databases.map((db) => (
            <SelectItem key={db} value={db}>
              {db}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DatabaseSelector;
