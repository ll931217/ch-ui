import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionScope, ScopeType } from "./permissions";

interface ScopeSelectorProps {
  scope: PermissionScope;
  onChange: (scope: PermissionScope) => void;
  allowedScopes: ScopeType[];
  databases: string[];
  tables?: Map<string, string[]>; // database -> tables
  disabled?: boolean;
  compact?: boolean;
}

const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  scope,
  onChange,
  allowedScopes,
  databases,
  tables = new Map(),
  disabled = false,
  compact = false,
}) => {
  // Build scope options
  const scopeOptions = useMemo(() => {
    const options: { value: string; label: string; scope: PermissionScope }[] = [];

    // Global scope
    if (allowedScopes.includes("global")) {
      options.push({
        value: "*.*",
        label: "*.* (all)",
        scope: { type: "global" },
      });
    }

    // Database scopes
    if (allowedScopes.includes("database")) {
      for (const db of databases) {
        options.push({
          value: `${db}.*`,
          label: `${db}.*`,
          scope: { type: "database", database: db },
        });
      }
    }

    // Table scopes
    if (allowedScopes.includes("table")) {
      for (const db of databases) {
        const dbTables = tables.get(db) || [];
        for (const table of dbTables) {
          options.push({
            value: `${db}.${table}`,
            label: `${db}.${table}`,
            scope: { type: "table", database: db, table },
          });
        }
      }
    }

    return options;
  }, [allowedScopes, databases, tables]);

  // Get current value string
  const currentValue = useMemo(() => {
    if (scope.type === "global") return "*.*";
    if (scope.type === "database" && scope.database) return `${scope.database}.*`;
    if (scope.type === "table" && scope.database && scope.table) {
      return `${scope.database}.${scope.table}`;
    }
    return "*.*";
  }, [scope]);

  const handleChange = (value: string) => {
    const option = scopeOptions.find((opt) => opt.value === value);
    if (option) {
      onChange(option.scope);
    }
  };

  // If only one scope type allowed and no options, show static text
  if (scopeOptions.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {currentValue}
      </span>
    );
  }

  // If only one option, show static text
  if (scopeOptions.length === 1) {
    return (
      <span className="text-sm text-muted-foreground">
        {scopeOptions[0].label}
      </span>
    );
  }

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className={compact ? "h-7 w-[140px] text-xs" : "w-[180px]"}>
        <SelectValue placeholder="Select scope" />
      </SelectTrigger>
      <SelectContent>
        {scopeOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={compact ? "text-xs" : ""}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ScopeSelector;
