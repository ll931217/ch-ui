// Toolbar for managing privilege presets

import React, { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Save, Plus, Trash2, Download, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useConnectionStore } from "@/store/connectionStore";
import { usePresetStore, exportPresets } from "./usePresetStore";
import { GrantedPermission } from "./permissions";
import { PresetExportData } from "./presetTypes";
import CreatePresetDialog from "./CreatePresetDialog";
import { grantsMatch } from "./grantUtils";

interface PresetToolbarProps {
  grants: GrantedPermission[];
  onApplyPreset: (grants: GrantedPermission[]) => void;
}

const PresetToolbar: React.FC<PresetToolbarProps> = ({
  grants,
  onApplyPreset,
}) => {
  const activeConnectionId = useConnectionStore(
    (state) => state.activeConnectionId
  );
  const { getPresets, ensureDefaultPresets, addPreset, updatePreset, deletePreset, importPresets } =
    usePresetStore();

  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guard: no active connection
  if (!activeConnectionId) {
    return null;
  }

  const presets = getPresets(activeConnectionId);
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  // Ensure default presets exist for this connection
  React.useEffect(() => {
    if (activeConnectionId) {
      ensureDefaultPresets(activeConnectionId);
    }
  }, [activeConnectionId, ensureDefaultPresets]);

  // Auto-detect matching preset when grants change
  useEffect(() => {
    if (!grants || grants.length === 0) {
      setSelectedPresetId("");
      return;
    }

    const matchingPreset = presets.find((preset) =>
      grantsMatch(preset.grants, grants)
    );

    setSelectedPresetId(matchingPreset?.id || "");
  }, [grants, presets]);

  // Handlers
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onApplyPreset(preset.grants);
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  const handleClearPreset = () => {
    setSelectedPresetId("");
  };

  const handleCreatePreset = (name: string) => {
    const newPreset = addPreset(activeConnectionId, name, grants);
    setSelectedPresetId(newPreset.id);
    toast.success(`Created preset: ${name}`);
  };

  const handleSavePreset = () => {
    if (!selectedPreset) return;

    updatePreset(activeConnectionId, selectedPreset.id, grants);
    toast.success(`Updated preset: ${selectedPreset.name}`);
  };

  const handleDeletePreset = () => {
    if (!selectedPreset) return;

    const presetName = selectedPreset.name;
    deletePreset(activeConnectionId, selectedPreset.id);
    setSelectedPresetId("");
    setDeleteDialogOpen(false);
    toast.success(`Deleted preset: ${presetName}`);
  };

  const handleExportPresets = () => {
    if (presets.length === 0) {
      toast.error("No presets to export");
      return;
    }

    const exportData = exportPresets(activeConnectionId);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `privilege-presets-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${presets.length} preset(s)`);
  };

  const handleImportPresets = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data: PresetExportData = JSON.parse(content);

      // Validate format
      if (data.version !== 1 || !Array.isArray(data.presets)) {
        toast.error("Invalid preset file format");
        return;
      }

      const existingNames = new Set(
        presets.map((p) => p.name.toLowerCase())
      );
      const duplicates = data.presets.filter((p) =>
        existingNames.has(p.name.toLowerCase())
      );

      importPresets(activeConnectionId, data.presets);

      const imported = data.presets.length - duplicates.length;
      if (imported > 0) {
        toast.success(`Imported ${imported} preset(s)`);
      }
      if (duplicates.length > 0) {
        toast.warning(
          `Skipped ${duplicates.length} duplicate preset(s): ${duplicates
            .map((p) => p.name)
            .join(", ")}`
        );
      }
    } catch (error) {
      toast.error("Failed to import presets. Invalid file format.");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
      {/* Preset Selector */}
      <div className="flex-1 max-w-md flex items-center gap-2">
        <Select value={selectedPresetId} onValueChange={handleSelectPreset}>
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                grants.length > 0
                  ? "Custom (no preset match)"
                  : "Select a preset..."
              }
            />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {preset.grants.length} privilege(s)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPresetId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearPreset}
            title="Clear selection"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSavePreset}
          disabled={!selectedPreset}
          title="Update selected preset"
          className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          <Save className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCreateDialogOpen(true)}
          title="Create new preset"
          className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={!selectedPreset}
          title="Delete selected preset"
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleExportPresets}
          disabled={presets.length === 0}
          title="Export all presets"
          className="cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Import presets"
          className="cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Upload className="h-4 w-4" />
        </Button>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportPresets}
          className="hidden"
        />
      </div>

      {/* Create Preset Dialog */}
      <CreatePresetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreatePreset}
        existingNames={presets.map((p) => p.name)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the preset "
              {selectedPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PresetToolbar;
