import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportWorkspace, downloadExport, importWorkspace, type ImportResult } from "@/lib/data-transfer";
import { Download, Upload, CheckCircle, AlertCircle, FileJson } from "lucide-react";

interface DataTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataTransferDialog({ open, onOpenChange }: DataTransferDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const blob = await exportWorkspace();
      downloadExport(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const result = await importWorkspace(file);
      setImportResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/json" || file?.name.endsWith(".json")) {
      handleImport(file);
    } else {
      setError("Please drop a valid JSON file");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const totalChanges = importResult
    ? importResult.pagesAdded + importResult.pagesUpdated +
      importResult.cardsAdded + importResult.cardsUpdated +
      importResult.deletionsApplied
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export / Import</DialogTitle>
          <DialogDescription>
            Sync your workspace across devices using a JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Export Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Workspace</h4>
            <p className="text-xs text-muted-foreground">
              Download all pages, boards, and cards as a single JSON file.
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Workspace"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Import & Merge</h4>
            <p className="text-xs text-muted-foreground">
              Import from another device. Newer changes win, nothing is lost.
            </p>
            <div
              className={`
                relative rounded-lg border-2 border-dashed p-6
                transition-colors cursor-pointer
                ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40"}
              `}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-muted p-2">
                  {isImporting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm">
                  {isImporting ? "Importing..." : "Drop file here or click to browse"}
                </div>
                <div className="text-xs text-muted-foreground">
                  <FileJson className="inline h-3 w-3 mr-1" />
                  my-notebook-YYYY-MM-DD.json
                </div>
              </div>
            </div>
          </div>

          {/* Result/Error Display */}
          {importResult && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Import complete
              </div>
              {totalChanges === 0 ? (
                <p className="text-xs text-muted-foreground pl-6">
                  Already in sync, no changes needed.
                </p>
              ) : (
                <ul className="text-xs text-muted-foreground pl-6 space-y-0.5">
                  {importResult.pagesAdded > 0 && <li>{importResult.pagesAdded} page(s) added</li>}
                  {importResult.pagesUpdated > 0 && <li>{importResult.pagesUpdated} page(s) updated</li>}
                  {importResult.cardsAdded > 0 && <li>{importResult.cardsAdded} card(s) added</li>}
                  {importResult.cardsUpdated > 0 && <li>{importResult.cardsUpdated} card(s) updated</li>}
                  {importResult.deletionsApplied > 0 && <li>{importResult.deletionsApplied} deletion(s) applied</li>}
                </ul>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
