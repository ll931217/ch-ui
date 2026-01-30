import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ImpactItem {
  type: "warning" | "info";
  message: string;
}

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;

  // Enhanced safety features
  requiresTypedConfirmation?: boolean;
  entityName?: string;
  impactPreview?: ImpactItem[];
  undoInfo?: string;
}

/**
 * Enhanced confirmation dialog with safety features for destructive operations
 *
 * Features:
 * - Optional typed confirmation (requires user to type entity name)
 * - Impact preview showing consequences of the action
 * - Undo information display
 * - Keyboard navigation support
 * - Cannot be bypassed when requiresTypedConfirmation is true
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  isLoading = false,
  requiresTypedConfirmation = false,
  entityName,
  impactPreview,
  undoInfo,
}: ConfirmationDialogProps) {
  const [typedName, setTypedName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const isConfirmDisabled = requiresTypedConfirmation
    ? typedName.trim() !== entityName?.trim()
    : false;

  const handleConfirm = async () => {
    if (isConfirmDisabled || isLoading || isConfirming) return;

    setIsConfirming(true);
    try {
      await onConfirm();
      setTypedName(""); // Reset typed name on success
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setTypedName(""); // Reset typed name on cancel
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isConfirmDisabled) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === "destructive" && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Impact Preview */}
          {impactPreview && impactPreview.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Impact Preview</Label>
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                {impactPreview.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {item.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={item.type === "warning" ? "text-yellow-600 dark:text-yellow-400" : ""}>
                      {item.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typed Confirmation */}
          {requiresTypedConfirmation && entityName && (
            <div className="space-y-2">
              <Label htmlFor="confirm-name" className="text-sm font-medium">
                Type <Badge variant="secondary" className="mx-1 font-mono">{entityName}</Badge> to confirm
              </Label>
              <Input
                id="confirm-name"
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={`Type "${entityName}" to confirm`}
                autoComplete="off"
                autoFocus
                className="font-mono"
              />
              {typedName && typedName !== entityName && (
                <p className="text-xs text-red-500">
                  Name does not match. Please type exactly: {entityName}
                </p>
              )}
            </div>
          )}

          {/* Undo Information */}
          {undoInfo && (
            <div className="border-l-4 border-blue-500 bg-blue-500/10 p-3 rounded">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Undo Information
                  </p>
                  <p className="text-blue-600/80 dark:text-blue-400/80">
                    {undoInfo}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading || isConfirming}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isLoading || isConfirming}
          >
            {isLoading || isConfirming ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
