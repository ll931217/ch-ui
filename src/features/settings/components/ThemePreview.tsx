interface ThemePreviewProps {
  colors: string[];
}

export function ThemePreview({ colors }: ThemePreviewProps) {
  return (
    <div className="flex gap-1 mr-2">
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
