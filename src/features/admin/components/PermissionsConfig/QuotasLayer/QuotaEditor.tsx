import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSqlGenerator } from "../hooks/useSqlGenerator";

interface QuotaData {
  name: string;
  id: string;
  durations: number[];
  max_queries: number[];
  max_errors: number[];
  max_result_rows: number[];
  max_read_rows: number[];
  max_execution_time: number[];
}

interface QuotaEditorProps {
  quota: QuotaData | null;
  onClose: () => void;
  onAddChange: (change: any) => void;
}

export default function QuotaEditor({ quota, onClose, onAddChange }: QuotaEditorProps) {
  const sqlGenerator = useSqlGenerator();
  const isNewQuota = !quota || !quota.name;

  // Form state
  const [quotaName, setQuotaName] = useState(quota?.name || "");
  const [duration, setDuration] = useState("3600"); // 1 hour default
  const [maxQueries, setMaxQueries] = useState("");
  const [maxErrors, setMaxErrors] = useState("");
  const [maxResultRows, setMaxResultRows] = useState("");
  const [maxReadRows, setMaxReadRows] = useState("");
  const [maxExecutionTime, setMaxExecutionTime] = useState("");

  const handleSave = () => {
    if (!quotaName.trim()) {
      return;
    }

    // Build quota options
    const options: any = {
      duration: `${duration} SECOND`,
    };

    if (maxQueries) options.queries = parseInt(maxQueries);
    if (maxErrors) options.errors = parseInt(maxErrors);
    if (maxResultRows) options.resultRows = parseInt(maxResultRows);
    if (maxReadRows) options.readRows = parseInt(maxReadRows);
    if (maxExecutionTime) options.executionTime = parseFloat(maxExecutionTime);

    if (isNewQuota) {
      // Create new quota
      const sql = sqlGenerator.generateCreateQuota(quotaName, options);

      onAddChange({
        type: "CREATE",
        entityType: "QUOTA",
        entityName: quotaName,
        description: `Create quota ${quotaName}`,
        sqlStatements: [sql],
        originalState: null,
        newState: {
          quotaName,
          duration,
          ...options,
        },
      });
    } else {
      // For ALTER, we'd need to drop and recreate in ClickHouse
      onAddChange({
        type: "ALTER",
        entityType: "QUOTA",
        entityName: quotaName,
        description: `Update quota ${quotaName}`,
        sqlStatements: [
          `DROP QUOTA IF EXISTS ${quotaName}`,
          sqlGenerator.generateCreateQuota(quotaName, options),
        ],
        originalState: quota,
        newState: options,
      });
    }

    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewQuota ? "Create New Quota" : `Edit Quota: ${quota?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quota name */}
          <div className="space-y-2">
            <Label htmlFor="quotaName">Quota Name</Label>
            <Input
              id="quotaName"
              value={quotaName}
              onChange={(e) => setQuotaName(e.target.value)}
              disabled={!isNewQuota}
              placeholder="Enter quota name (e.g., default_quota)"
            />
          </div>

          {/* Interval duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Interval Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="600">10 minutes</SelectItem>
                <SelectItem value="1800">30 minutes</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="86400">1 day</SelectItem>
                <SelectItem value="604800">1 week</SelectItem>
                <SelectItem value="2592000">30 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Time window for quota limits
            </p>
          </div>

          {/* Limits */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium">Resource Limits</h4>
            <p className="text-xs text-muted-foreground">
              Leave empty for no limit on that resource
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Max queries */}
              <div className="space-y-2">
                <Label htmlFor="maxQueries">Max Queries</Label>
                <Input
                  id="maxQueries"
                  type="number"
                  value={maxQueries}
                  onChange={(e) => setMaxQueries(e.target.value)}
                  placeholder="No limit"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Total queries allowed
                </p>
              </div>

              {/* Max errors */}
              <div className="space-y-2">
                <Label htmlFor="maxErrors">Max Errors</Label>
                <Input
                  id="maxErrors"
                  type="number"
                  value={maxErrors}
                  onChange={(e) => setMaxErrors(e.target.value)}
                  placeholder="No limit"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum query errors
                </p>
              </div>

              {/* Max result rows */}
              <div className="space-y-2">
                <Label htmlFor="maxResultRows">Max Result Rows</Label>
                <Input
                  id="maxResultRows"
                  type="number"
                  value={maxResultRows}
                  onChange={(e) => setMaxResultRows(e.target.value)}
                  placeholder="No limit"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Rows in result sets
                </p>
              </div>

              {/* Max read rows */}
              <div className="space-y-2">
                <Label htmlFor="maxReadRows">Max Read Rows</Label>
                <Input
                  id="maxReadRows"
                  type="number"
                  value={maxReadRows}
                  onChange={(e) => setMaxReadRows(e.target.value)}
                  placeholder="No limit"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Rows read from tables
                </p>
              </div>

              {/* Max execution time */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="maxExecutionTime">
                  Max Execution Time (seconds)
                </Label>
                <Input
                  id="maxExecutionTime"
                  type="number"
                  step="0.1"
                  value={maxExecutionTime}
                  onChange={(e) => setMaxExecutionTime(e.target.value)}
                  placeholder="No limit"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum query execution time
                </p>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="border-l-4 border-blue-500 bg-blue-500/10 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Quotas</strong> limit resource consumption over a specified time
              interval. They help prevent individual users or roles from overusing
              system resources.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNewQuota ? "Stage Create" : "Stage Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
