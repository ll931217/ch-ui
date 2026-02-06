import React, { useState, useMemo } from "react";
import { X, FileJson, FileCode, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  detectValueType,
  formatValue,
  ValueType,
} from "@/lib/valueFormatter";

interface ValueSidebarProps {
  fieldName: string;
  rowIndex: number;
  value: any;
  onClose: () => void;
}

/**
 * Sidebar panel for displaying and formatting selected cell values
 *
 * Features:
 * - Auto-detects value type (JSON, XML, SQL, plain text)
 * - Toggle between raw and formatted view
 * - Read-only display with monospace font
 */
const ValueSidebar: React.FC<ValueSidebarProps> = ({
  fieldName,
  rowIndex,
  value,
  onClose,
}) => {
  const [isFormatted, setIsFormatted] = useState(false);

  // Convert value to string
  const stringValue = useMemo(() => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }, [value]);

  // Detect value type
  const valueType = useMemo(
    () => detectValueType(stringValue),
    [stringValue]
  );

  // Get display value (raw or formatted)
  const displayValue = useMemo(() => {
    if (!isFormatted) {
      return stringValue;
    }
    return formatValue(stringValue, valueType);
  }, [stringValue, valueType, isFormatted]);

  // Get type icon
  const getTypeIcon = (type: ValueType) => {
    switch (type) {
      case "json":
        return <FileJson className="h-3 w-3" />;
      case "xml":
        return <FileCode className="h-3 w-3" />;
      case "sql":
        return <Database className="h-3 w-3" />;
      case "text":
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Get type badge variant
  const getTypeBadgeVariant = (type: ValueType) => {
    switch (type) {
      case "json":
        return "default";
      case "xml":
        return "secondary";
      case "sql":
        return "outline";
      case "text":
      default:
        return "secondary";
    }
  };

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-medium text-sm truncate">{fieldName}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            Row {rowIndex + 1}
          </Badge>
          <Badge
            variant={getTypeBadgeVariant(valueType)}
            className="text-xs shrink-0 gap-1"
          >
            {getTypeIcon(valueType)}
            {valueType.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {/* Format toggle button - only show for formattable types */}
          {valueType !== "text" && (
            <Button
              variant={isFormatted ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsFormatted(!isFormatted)}
              className="h-7 px-2"
            >
              {isFormatted ? "Raw" : "Format"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 overflow-hidden">
        <Textarea
          value={displayValue}
          readOnly
          className="h-full resize-none font-mono text-sm"
          style={{ minHeight: "100%" }}
        />
      </div>
    </div>
  );
};

export default ValueSidebar;
