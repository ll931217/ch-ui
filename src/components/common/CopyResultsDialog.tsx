import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Copy, CopyCheck } from "lucide-react";
import { toast } from "sonner";
import {
  formatData,
  ExportFormat,
  getAvailableFormats,
  getFormatDisplayName,
} from "@/lib/formatUtils";

interface CopyResultsDialogProps {
  data: Record<string, unknown>[];
  columns: string[];
  tableName?: string;
}

const CopyResultsDialog: React.FC<CopyResultsDialogProps> = ({
  data,
  columns,
  tableName = "table_name",
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const formatted = formatData(data, columns, selectedFormat, tableName);
      await navigator.clipboard.writeText(formatted);

      const formatName = getFormatDisplayName(selectedFormat);
      const rowCount = data.length;

      toast.success(
        `Copied ${rowCount} row${rowCount !== 1 ? "s" : ""} in ${formatName} format`
      );

      setCopied(true);
      setTimeout(() => {
        setOpen(false);
        setCopied(false);
      }, 1000);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy data. Please try again.");
    }
  }, [data, columns, selectedFormat, tableName]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={selectedFormat}
            onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
          >
            {getAvailableFormats().map((format) => (
              <div key={format} className="flex items-center space-x-2">
                <RadioGroupItem value={format} id={format} />
                <Label htmlFor={format} className="cursor-pointer">
                  {getFormatDisplayName(format)}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="text-sm text-gray-500">
            {data.length} row{data.length !== 1 ? "s" : ""} will be copied
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              disabled={copied}
              variant="outline"
            >
              {copied ? (
                <>
                  <CopyCheck className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyResultsDialog;
