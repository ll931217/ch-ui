import { Moon, Sun, Palette } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/components/common/theme-provider";
import { useAppearance } from "@/contexts/AppearanceContext";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "high-contrast-light", label: "High Contrast Light", icon: Sun },
  { value: "high-contrast-dark", label: "High Contrast Dark", icon: Moon },
  { value: "system", label: "System", icon: Palette },
] as const;

const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 32;

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { uiFontSize, editorFontSize, setUIFontSize, setEditorFontSize } =
    useAppearance();

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card className="shadow-lg border-muted">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Theme
          </CardTitle>
          <CardDescription>
            Select your preferred color theme for the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-select">Color Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Font Sizes */}
      <Card className="shadow-lg border-muted">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Font Sizes</CardTitle>
          <CardDescription>
            Adjust font sizes for the interface and code editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* UI Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="ui-font-size" className="text-sm font-medium">
                UI Font Size
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
                {uiFontSize}px
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-8 text-right">
                {FONT_SIZE_MIN}
              </span>
              <Slider
                id="ui-font-size"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                step={1}
                value={[uiFontSize]}
                onValueChange={(value) => setUIFontSize(value[0])}
                className="flex-1"
                aria-label="UI Font Size"
              />
              <span className="text-xs text-muted-foreground w-8">
                {FONT_SIZE_MAX}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controls the font size for buttons, labels, menus, and other UI
              elements
            </p>
          </div>

          {/* Editor Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="editor-font-size" className="text-sm font-medium">
                Editor Font Size
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
                {editorFontSize}px
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-8 text-right">
                {FONT_SIZE_MIN}
              </span>
              <Slider
                id="editor-font-size"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                step={1}
                value={[editorFontSize]}
                onValueChange={(value) => setEditorFontSize(value[0])}
                className="flex-1"
                aria-label="Editor Font Size"
              />
              <span className="text-xs text-muted-foreground w-8">
                {FONT_SIZE_MAX}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controls the font size for the Monaco code editor
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
