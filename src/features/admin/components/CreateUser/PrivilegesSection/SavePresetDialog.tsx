// Dialog for saving a privilege preset (create new or update existing)

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  existingNames: string[];
  defaultName?: string; // Pre-fill for edit mode
  isNewPreset?: boolean; // Show "Create" vs "Save" title
}

const SavePresetDialog: React.FC<SavePresetDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  existingNames,
  defaultName = "",
  isNewPreset = true,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Initialize with defaultName when dialog opens
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setError("");
    } else {
      setName("");
      setError("");
    }
  }, [open, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate non-empty
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Preset name cannot be empty");
      return;
    }

    // Validate unique name (case-insensitive), except for the current name when editing
    const normalizedName = trimmedName.toLowerCase();
    const normalizedDefault = defaultName.toLowerCase();
    const isDuplicateName = existingNames.some(
      (n) => n.toLowerCase() === normalizedName && normalizedName !== normalizedDefault
    );

    if (isDuplicateName) {
      setError("A preset with this name already exists");
      return;
    }

    onSave(trimmedName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isNewPreset ? "Create New Preset" : "Save Preset"}
          </DialogTitle>
          <DialogDescription>
            {isNewPreset
              ? "Save the current privilege configuration as a preset. You can load it later to quickly apply the same privileges."
              : "Save changes to the current preset or rename it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Read-Only Access"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isNewPreset ? "Create Preset" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavePresetDialog;
