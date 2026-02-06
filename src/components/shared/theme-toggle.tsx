import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, cycleTheme } = useAppStore();

  const themeIcon = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const themeLabel = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
          onClick={cycleTheme}
        >
          {themeIcon[theme]}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {themeLabel[theme]}{" "}
        <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">
          ⌘⇧L
        </kbd>
      </TooltipContent>
    </Tooltip>
  );
}
