import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Activity,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAuditLog, AuditLogEntry, AuditLogFilters } from "../hooks/useAuditLog";
import { format } from "date-fns";
import { toast } from "sonner";

/**
 * Audit Log Viewer component for reviewing permission changes
 */
export default function AuditLogViewer() {
  const { queryAuditLogs, getAuditStats } = useAuditLog();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Filters
  const [usernameFilter, setUsernameFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState<string>("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    totalChanges: 0,
    successfulChanges: 0,
    failedChanges: 0,
    recentActivity: [] as Array<{ date: string; count: number }>,
    topUsers: [] as Array<{ username: string; count: number }>,
    operationBreakdown: [] as Array<{ operation: string; count: number }>,
  });

  /**
   * Load audit logs with current filters
   */
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const filters: AuditLogFilters = {
        limit: 100,
        offset: 0,
      };

      if (usernameFilter) filters.username = usernameFilter;
      if (operationFilter) filters.operation = operationFilter;
      if (entityTypeFilter) filters.entityType = entityTypeFilter;
      if (successFilter !== "all") filters.success = successFilter === "success";
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const results = await queryAuditLogs(filters);
      setLogs(results);
    } catch (error) {
      toast.error("Failed to load audit logs");
      console.error("Error loading audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load statistics
   */
  const loadStats = async () => {
    try {
      const statistics = await getAuditStats();
      setStats(statistics);
    } catch (error) {
      console.error("Error loading audit stats:", error);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setUsernameFilter("");
    setOperationFilter("");
    setEntityTypeFilter("");
    setSuccessFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-medium mb-2">Audit Log</h2>
        <p className="text-gray-400">Review all permission changes and their history</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChanges}</div>
            <p className="text-xs text-gray-400 mt-1">All-time changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.successfulChanges}</div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalChanges > 0
                ? `${((stats.successfulChanges / stats.totalChanges) * 100).toFixed(1)}% success rate`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.failedChanges}</div>
            <p className="text-xs text-gray-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" aria-hidden="true" />
            Filters
          </CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="username-filter" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username-filter"
                placeholder="Filter by username..."
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="operation-filter" className="text-sm font-medium">
                Operation
              </label>
              <Select value={operationFilter} onValueChange={setOperationFilter}>
                <SelectTrigger id="operation-filter">
                  <SelectValue placeholder="All operations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All operations</SelectItem>
                  <SelectItem value="GRANT">GRANT</SelectItem>
                  <SelectItem value="REVOKE">REVOKE</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="ALTER">ALTER</SelectItem>
                  <SelectItem value="DROP">DROP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="entity-type-filter" className="text-sm font-medium">
                Entity Type
              </label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger id="entity-type-filter">
                  <SelectValue placeholder="All entity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entity types</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ROLE">ROLE</SelectItem>
                  <SelectItem value="QUOTA">QUOTA</SelectItem>
                  <SelectItem value="ROW_POLICY">ROW_POLICY</SelectItem>
                  <SelectItem value="SETTINGS_PROFILE">SETTINGS_PROFILE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="success-filter" className="text-sm font-medium">
                Status
              </label>
              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger id="success-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success only</SelectItem>
                  <SelectItem value="failure">Failures only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadLogs} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" aria-hidden="true" />
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline" disabled={isLoading}>
              Clear
            </Button>
            <Button onClick={() => { loadLogs(); loadStats(); }} variant="outline" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" aria-hidden="true" />
            Audit Trail ({logs.length})
          </CardTitle>
          <CardDescription>Chronological log of all permission changes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" aria-hidden="true" />
              <span className="ml-2 text-gray-400">Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mb-2" aria-hidden="true" />
              <p>No audit logs found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-gray-800/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="font-mono text-xs">
                        {format(log.timestamp, "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" aria-hidden="true" />
                          {log.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.operation}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">{log.entityType}</div>
                          <div className="font-medium">{log.entityName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.description}</TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-red-500/10 text-red-500 border-red-500/20">
                            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Audit Log Details</CardTitle>
              <CardDescription>
                {format(selectedLog.timestamp, "yyyy-MM-dd HH:mm:ss")} by {selectedLog.username}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-400">Operation</div>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedLog.operation}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">Entity</div>
                  <div className="mt-1">
                    {selectedLog.entityType} - {selectedLog.entityName}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">Status</div>
                  <div className="mt-1">
                    {selectedLog.success ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-red-500/10 text-red-500 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">ID</div>
                  <div className="mt-1 font-mono text-xs">{selectedLog.id}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">Description</div>
                <div className="bg-gray-800/50 rounded-md p-3">{selectedLog.description}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-400 mb-1">SQL Statements</div>
                <div className="bg-gray-900 rounded-md p-3 font-mono text-xs space-y-2">
                  {selectedLog.sqlStatements.map((sql, i) => (
                    <div key={i} className="border-l-2 border-blue-500 pl-3">
                      {sql}
                    </div>
                  ))}
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <div className="text-sm font-medium text-red-500 mb-1">Error Message</div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-red-400">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {selectedLog.beforeState && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Before State</div>
                  <pre className="bg-gray-900 rounded-md p-3 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.beforeState, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterState && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">After State</div>
                  <pre className="bg-gray-900 rounded-md p-3 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.afterState, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setSelectedLog(null)} variant="outline">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
