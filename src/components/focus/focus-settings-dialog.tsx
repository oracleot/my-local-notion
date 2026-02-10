import { useState, useEffect } from "react";
import { getFocusSettings, updateFocusSettings } from "@/lib/focus-helpers";
import { useAppStore } from "@/stores/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { FocusSettings } from "@/types";

interface FocusSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: FocusSettings) => void;
}

export function FocusSettingsDialog({ open, onOpenChange, onSettingsChange }: FocusSettingsDialogProps) {
  const loadFocusSettings = useAppStore((s) => s.loadFocusSettings);
  const [audio, setAudio] = useState(true);
  const [dayStart, setDayStart] = useState(8);
  const [dayEnd, setDayEnd] = useState(18);
  const [presets, setPresets] = useState<number[]>([25, 40, 60]);
  const [newPreset, setNewPreset] = useState("");

  useEffect(() => {
    if (!open) return;
    getFocusSettings().then((s) => {
      setAudio(s.audioEnabled);
      setDayStart(s.dayStartHour);
      setDayEnd(s.dayEndHour);
      setPresets(s.durationPresets ?? [25, 40, 60]);
    });
  }, [open]);

  const handleAddPreset = () => {
    const value = parseInt(newPreset, 10);
    if (isNaN(value) || value <= 0 || value > 60 || presets.includes(value)) return;
    setPresets([...presets, value].sort((a, b) => a - b));
    setNewPreset("");
  };

  const handleRemovePreset = (value: number) => {
    if (presets.length <= 1) return;
    setPresets(presets.filter((p) => p !== value));
  };

  const handleSave = async () => {
    const updated = await updateFocusSettings({
      workMinutes: 60, breakMinutes: 0, audioEnabled: audio,
      dayStartHour: dayStart, dayEndHour: dayEnd, durationPresets: presets,
    });
    loadFocusSettings({ workMinutes: updated.workMinutes, breakMinutes: updated.breakMinutes, audioEnabled: updated.audioEnabled });
    onSettingsChange(updated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Focus Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <SettingRow label="Chime on completion">
            <ToggleSwitch value={audio} onChange={setAudio} />
          </SettingRow>
          <SettingRow label="Day start hour">
            <HourSelect value={dayStart} onChange={setDayStart} mode="start" />
          </SettingRow>
          <SettingRow label="Day end hour">
            <HourSelect value={dayEnd} onChange={setDayEnd} mode="end" />
          </SettingRow>
          <div className="space-y-2">
            <span className="text-[13px] text-foreground/80">Duration presets</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[12px]">
                  {p}m
                  {presets.length > 1 && (
                    <button onClick={() => handleRemovePreset(p)} className="ml-0.5 text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input type="number" min={1} max={60} placeholder="Add preset" value={newPreset}
                onChange={(e) => setNewPreset(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddPreset()}
                className="h-8 flex-1 text-[13px]" />
              <Button variant="outline" size="sm" className="h-8" onClick={handleAddPreset}>Add</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" className="text-[13px]" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-[13px]" onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-[13px] text-foreground/80">{label}</span>{children}</div>;
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function HourSelect({ value, onChange, mode }: { value: number; onChange: (v: number) => void; mode: "start" | "end" }) {
  const hours = mode === "start" ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 24 }, (_, i) => i + 1);
  const formatHour = (h: number) => h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : h === 24 ? "12 AM" : `${h - 12} PM`;
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8 rounded-md border border-input bg-background px-2 text-[13px]">
      {hours.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
    </select>
  );
}
