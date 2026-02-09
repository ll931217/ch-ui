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
import { Save, Plus, Trash2, Download, Upload, Star } from "lucide-react";
import { toast } from "sonner";
import { useConnectionStore } from "@/store/connectionStore";
import { usePresetStore, exportPresets } from "./usePresetStore";
import { GrantedPermission } from "./permissions";
import { PresetExportData } from "./presetTypes";
import SavePresetDialog from "./SavePresetDialog";
import { grantsMatch } from "./grantUtils";

interface PresetToolbarProps {
  grants: GrantedPermission[];
  onApplyPreset: (grants: GrantedPermission[]) => void;
}

type EditMode =
  | { type: "idle" } // Normal state
  | { type: "creating"; tempName: string } // Creating new preset
  | { type: "editing"; presetId: string }; // Editing existing preset

const TEMP_PRESET_ID = "__TEMP_NEW_PRESET__";
const DEFAULT_NEW_PRESET_NAME = "NEW PRESET";

const PresetToolbar: React.FC<PresetToolbarProps> = ({
  grants,
  onApplyPreset,
}) => {
  const activeConnectionId = useConnectionStore(
    (state) => state.activeConnectionId
  );
  const {
    getPresets,
    ensureDefaultPresets,
    addPreset,
    updatePreset,
    deletePreset,
    importPresets,
    setDefaultPreset,
    getDefaultPreset,
  } = usePresetStore();

  const [editMode, setEditMode] = useState<EditMode>({ type: "idle" });
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guard: no active connection
  if (!activeConnectionId) {
    return null;
  }

  const presets = getPresets(activeConnectionId);
  const defaultPresetId = getDefaultPreset(activeConnectionId);
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  // Ensure default presets exist for this connection
  React.useEffect(() => {
    if (activeConnectionId) {
      ensureDefaultPresets(activeConnectionId);
    }
  }, [activeConnectionId, ensureDefaultPresets]);

  // Auto-detect matching preset when grants change (only in idle mode)
  useEffect(() => {
    if (editMode.type !== "idle") {
      return; // Disable auto-detection during edit/create
    }

    if (!grants || grants.length === 0) {
      setSelectedPresetId("");
      return;
    }

    const matchingPreset = presets.find((preset) =>
      grantsMatch(preset.grants, grants)
    );

    setSelectedPresetId(matchingPreset?.id || "");
  }, [grants, presets, editMode.type]);

  // Handlers
  const handleSelectPreset = (presetId: string) => {
    if (presetId === TEMP_PRESET_ID) {
      return; // Can't select the temp preset
    }

    setSelectedPresetId(presetId);
    setEditMode({ type: "editing", presetId });

    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onApplyPreset(preset.grants);
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  const handleCreateNew = () => {
    setEditMode({ type: "creating", tempName: DEFAULT_NEW_PRESET_NAME });
    setSelectedPresetId(TEMP_PRESET_ID);
    onApplyPreset([]); // Clear all privileges
    toast.info("Creating new preset - select privileges below");
  };

  const handleOpenSaveDialog = () => {
    setSaveDialogOpen(true);
  };

  const handleSavePreset = (name: string) => {
    if (editMode.type === "creating") {
      // Create new preset
      const newPreset = addPreset(activeConnectionId, name, grants);
      setSelectedPresetId(newPreset.id);
      setEditMode({ type: "idle" });
      toast.success(`Created preset: ${name}`);
    } else if (editMode.type === "editing") {
      // Update existing preset
      const currentName = selectedPreset?.name || "";
      updatePreset(activeConnectionId, editMode.presetId, grants, name);
      setEditMode({ type: "idle" });

      if (name !== currentName) {
        toast.success(`Updated and renamed preset to: ${name}`);
      } else {
        toast.success(`Updated preset: ${name}`);
      }
    }
  };

  const handleCancelEdit = () => {
    if (editMode.type === "creating") {
      toast.info("Cancelled preset creation");
    }
    setEditMode({ type: "idle" });
    setSelectedPresetId("");
    onApplyPreset([]); // Clear privileges
  };

  const handleDeletePreset = () => {
    if (!selectedPreset) return;

    const presetName = selectedPreset.name;
    deletePreset(activeConnectionId, selectedPreset.id);
    setSelectedPresetId("");
    setEditMode({ type: "idle" });
    setDeleteDialogOpen(false);
    toast.success(`Deleted preset: ${presetName}`);
  };

  const handleSetDefault = () => {
    if (!selectedPreset) return;

    setDefaultPreset(activeConnectionId, selectedPreset.id);
    toast.success(`Set "${selectedPreset.name}" as default preset`);
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

      const existingNames = new Set(presets.map((p) => p.name.toLowerCase()));
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

  // Determine what to show in the select
  const displayValue =
    editMode.type === "creating"
      ? DEFAULT_NEW_PRESET_NAME
      : selectedPreset
        ? selectedPreset.name
        : grants.length > 0
          ? "Custom (no preset match)"
          : "Select a preset...";

  const isDefaultPreset = selectedPresetId === defaultPresetId;

  return (
    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
      {/* Preset Selector */}
      <div className="flex-1 max-w-md">
        <Select value={selectedPresetId} onValueChange={handleSelectPreset}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={displayValue} />
          </SelectTrigger>
          <SelectContent>
            {editMode.type === "creating" && (
              <SelectItem value={TEMP_PRESET_ID} disabled>
                <div className="flex flex-col">
                  <span className="font-medium text-blue-600">
                    {DEFAULT_NEW_PRESET_NAME}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Creating new preset...
                  </span>
                </div>
              </SelectItem>
            )}
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <div className="flex items-center gap-2">
                  {preset.id === defaultPresetId && (
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.grants.length} privilege(s)
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Save Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenSaveDialog}
          disabled={editMode.type === "idle"}
          title={
            editMode.type === "creating"
              ? "Save new preset"
              : editMode.type === "editing"
                ? "Save changes to preset"
                : "No changes to save"
          }
          className="cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          <Save className="h-4 w-4" />
        </Button>

        {/* Create Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateNew}
          disabled={editMode.type !== "idle"}
          title="Create new preset"
          className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Default (Star) Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSetDefault}
          disabled={!selectedPreset || editMode.type === "creating"}
          title={
            isDefaultPreset
              ? "This is the default preset"
              : "Set as default preset"
          }
          className={
            isDefaultPreset
              ? "cursor-pointer text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
              : "cursor-pointer text-muted-foreground hover:text-foreground"
          }
        >
          <Star
            className={`h-4 w-4 ${isDefaultPreset ? "fill-yellow-500" : ""}`}
          />
        </Button>

        {/* Delete/Cancel Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={
            editMode.type === "creating"
              ? handleCancelEdit
              : () => setDeleteDialogOpen(true)
          }
          disabled={
            editMode.type === "idle" ||
            (editMode.type === "editing" && !selectedPreset)
          }
          title={editMode.type === "creating" ? "Cancel" : "Delete preset"}
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Export Button */}
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

        {/* Import Button */}
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

      {/* Save Preset Dialog */}
      <SavePresetDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSavePreset}
        existingNames={presets.map((p) => p.name)}
        defaultName={
          editMode.type === "creating"
            ? DEFAULT_NEW_PRESET_NAME
            : selectedPreset?.name || ""
        }
        isNewPreset={editMode.type === "creating"}
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
