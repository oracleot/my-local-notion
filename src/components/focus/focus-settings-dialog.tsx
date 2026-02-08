import { useState, useEffect } from "react";
import {
  getFocusSettings,
  updateFocusSettings,
} from "@/lib/focus-helpers";
import { useAppStore } from "@/stores/app-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FocusSettings } from "@/types";

interface FocusSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: FocusSettings) => void;
}

export function FocusSettingsDialog({
  open,
  onOpenChange,
  onSettingsChange,
}: FocusSettingsDialogProps) {
  const loadFocusSettings = useAppStore((s) => s.loadFocusSettings);
  const [audio, setAudio] = useState(true);
  const [dayStart, setDayStart] = useState(8);
  const [dayEnd, setDayEnd] = useState(18);

  // Load current settings when dialog opens
  useEffect(() => {
    if (!open) return;
    getFocusSettings().then((s) => {
      setAudio(s.audioEnabled);
      setDayStart(s.dayStartHour);
      setDayEnd(s.dayEndHour);
    });
  }, [open]);

  const handleSave = async () => {
    const updated = await updateFocusSettings({
      workMinutes: 60,
      breakMinutes: 0,
      audioEnabled: audio,
      dayStartHour: dayStart,
      dayEndHour: dayEnd,
    });
    loadFocusSettings({
      workMinutes: updated.workMinutes,
      breakMinutes: updated.breakMinutes,
      audioEnabled: updated.audioEnabled,
    });
    onSettingsChange(updated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Focus Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Audio */}
          <SettingField label="Chime on completion">
            <button
              onClick={() => setAudio(!audio)}
              className={`
                relative h-6 w-11 rounded-full transition-colors
                ${audio ? "bg-primary" : "bg-muted"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm
                  ${audio ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
          </SettingField>

          {/* Working hours */}
          <SettingField label="Day start hour">
            <select
              value={dayStart}
              onChange={(e) => setDayStart(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-[13px]"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                </option>
              ))}
            </select>
          </SettingField>

          <SettingField label="Day end hour">
            <select
              value={dayEnd}
              onChange={(e) => setDayEnd(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-[13px]"
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : h === 24 ? "12 AM" : `${h - 12} PM`}
                </option>
              ))}
            </select>
          </SettingField>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-[13px]" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-foreground/80">{label}</span>
      {children}
    </div>
  );
}
