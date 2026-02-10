import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Timer } from "lucide-react";

interface DurationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  availableCapacity: number;
  presets: number[];
  isCurrentHour: boolean;
  onSelectDuration: (minutes: number) => void;
}

export function DurationPickerDialog({
  open,
  onOpenChange,
  taskTitle,
  availableCapacity,
  presets,
  isCurrentHour,
  onSelectDuration,
}: DurationPickerDialogProps) {
  const [customMinutes, setCustomMinutes] = useState("");

  // Filter presets to only show those within available capacity
  const validPresets = presets.filter((p) => p <= availableCapacity);

  const handleCustomSubmit = () => {
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    if (mins > availableCapacity) return;
    onSelectDuration(mins);
    setCustomMinutes("");
    onOpenChange(false);
  };

  const handlePresetClick = (minutes: number) => {
    onSelectDuration(minutes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs gap-0 p-0">
        <DialogHeader className="border-b border-border/50 px-4 pt-4 pb-3">
          <DialogTitle className="text-base font-semibold">
            Choose duration
          </DialogTitle>
          <p className="mt-1 truncate text-[13px] text-muted-foreground/70">
            {taskTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4">
          {/* Capacity info */}
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Clock className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-[13px] text-muted-foreground">
              {isCurrentHour ? "Time left" : "Available"}:{" "}
              <span className="font-medium text-foreground">
                {availableCapacity}m
              </span>
            </span>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {validPresets.map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-3 text-[13px]"
                onClick={() => handlePresetClick(preset)}
              >
                <Timer className="h-3.5 w-3.5" />
                {preset}m
              </Button>
            ))}

            {/* Show "remaining time" button for current hour if not already in presets */}
            {isCurrentHour &&
              availableCapacity > 0 &&
              !validPresets.includes(availableCapacity) && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 gap-1.5 px-3 text-[13px]"
                  onClick={() => handlePresetClick(availableCapacity)}
                >
                  <Timer className="h-3.5 w-3.5" />
                  {availableCapacity}m (remaining)
                </Button>
              )}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={availableCapacity}
              placeholder="Custom minutes"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              className="h-9 flex-1 text-[13px]"
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-9 px-3 text-[13px]"
              onClick={handleCustomSubmit}
              disabled={
                !customMinutes ||
                parseInt(customMinutes, 10) <= 0 ||
                parseInt(customMinutes, 10) > availableCapacity
              }
            >
              Set
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
