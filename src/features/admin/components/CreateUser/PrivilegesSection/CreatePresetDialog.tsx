// Dialog for creating a new privilege preset

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

interface CreatePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  existingNames: string[];
}

const CreatePresetDialog: React.FC<CreatePresetDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  existingNames,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("");
      setError("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate non-empty
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Preset name cannot be empty");
      return;
    }

    // Validate unique name (case-insensitive)
    const normalizedName = trimmedName.toLowerCase();
    if (existingNames.some((n) => n.toLowerCase() === normalizedName)) {
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
          <DialogTitle>Create Preset</DialogTitle>
          <DialogDescription>
            Save the current privilege configuration as a preset. You can load
            it later to quickly apply the same privileges.
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
            <Button type="submit">Create Preset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePresetDialog;
