import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  theme: {
    value: string;
    label: string;
    colors: readonly string[];
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary ring-2 ring-primary"
          : "border-muted hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{theme.label}</span>
          <div className="flex space-x-1">
            {theme.colors.map((color, index) => (
              <div
                key={index}
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
