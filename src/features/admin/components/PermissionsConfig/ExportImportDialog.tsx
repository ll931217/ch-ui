import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileJson, AlertCircle } from "lucide-react";
import { useExportImport, type EntityType, type ExportScope } from "./hooks/useExportImport";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function ExportImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportScope, setExportScope] = useState<ExportScope>("all");
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([
    "users",
    "roles",
    "quotas",
  ]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    exportPermissions,
    downloadExport,
    readImportFile,
    validateImport,
    importPermissions,
  } = useExportImport();

  const entityTypes: Array<{ value: EntityType; label: string }> = [
    { value: "users", label: "Users" },
    { value: "roles", label: "Roles" },
    { value: "quotas", label: "Quotas" },
    { value: "row_policies", label: "Row Policies" },
    { value: "settings_profiles", label: "Settings Profiles" },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportPermissions(exportScope);
      const filename = `permissions-${exportScope}-${new Date().toISOString().slice(0, 10)}.json`;
      downloadExport(data, filename);
      toast.success(`Exported ${exportScope} permissions successfully`);
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    try {
      const data = await readImportFile(file);
      if (validateImport(data)) {
        setImportData(data);
        toast.info("File loaded successfully. Review and confirm import.");
      } else {
        setImportData(null);
        setImportFile(null);
      }
    } catch (error) {
      toast.error(`Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`);
      setImportFile(null);
      setImportData(null);
    }
  };

  const handleImport = async () => {
    if (!importData) return;

    setIsImporting(true);
    try {
      const result = await importPermissions(importData, selectedTypes);
      if (result.success) {
        toast.success("Import completed successfully");
        setIsOpen(false);
        setImportData(null);
        setImportFile(null);
      }
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleType = (type: EntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileJson className="w-4 h-4" />
          Export/Import
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export/Import Permissions</DialogTitle>
          <DialogDescription>
            Backup and restore permissions configuration
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "export" | "import")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">Export Scope</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-all"
                    checked={exportScope === "all"}
                    onCheckedChange={() => setExportScope("all")}
                  />
                  <Label htmlFor="export-all" className="font-normal cursor-pointer">
                    Export All (recommended)
                  </Label>
                </div>

                <div className="ml-6 space-y-2">
                  {entityTypes.map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`export-${value}`}
                        checked={exportScope === value}
                        onCheckedChange={() => setExportScope(value)}
                      />
                      <Label htmlFor={`export-${value}`} className="font-normal cursor-pointer">
                        {label} only
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Exported data includes all permissions, settings, and configurations for the
                selected scope. Store backup files securely.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting} className="gap-2">
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Export to JSON"}
              </Button>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">Select Import File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
            </div>

            {importData && (
              <>
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Import Preview:</p>
                      <p className="text-xs">
                        Version: {importData.version} | Exported: {new Date(importData.exportedAt).toLocaleString()}
                      </p>
                      <p className="text-xs">
                        By: {importData.exportedBy}
                      </p>
                      {importData.users && (
                        <p className="text-xs">Users: {importData.users.length}</p>
                      )}
                      {importData.roles && (
                        <p className="text-xs">Roles: {importData.roles.length}</p>
                      )}
                      {importData.quotas && (
                        <p className="text-xs">Quotas: {importData.quotas.length}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Import Options (Partial Import)
                  </Label>
                  <div className="space-y-2">
                    {entityTypes.map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`import-${value}`}
                          checked={selectedTypes.includes(value)}
                          onCheckedChange={() => toggleType(value)}
                          disabled={!importData[value]}
                        />
                        <Label
                          htmlFor={`import-${value}`}
                          className={`font-normal cursor-pointer ${!importData[value] ? "text-muted-foreground" : ""}`}
                        >
                          Import {label}
                          {importData[value] && ` (${importData[value].length})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importData || selectedTypes.length === 0 || isImporting}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? "Importing..." : "Import Permissions"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
