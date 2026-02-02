import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEYS = {
  UI_FONT_SIZE: "ch-ui-font-size",
  EDITOR_FONT_SIZE: "ch-ui-editor-font-size",
} as const;

const DEFAULT_VALUES = {
  UI_FONT_SIZE: 14,
  EDITOR_FONT_SIZE: 14,
} as const;

interface AppearanceSettings {
  uiFontSize: number;
  editorFontSize: number;
  setUIFontSize: (size: number) => void;
  setEditorFontSize: (size: number) => void;
}

const AppearanceContext = createContext<AppearanceSettings | undefined>(
  undefined
);

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [uiFontSize, setUIFontSizeState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.UI_FONT_SIZE);
    return stored ? parseInt(stored, 10) : DEFAULT_VALUES.UI_FONT_SIZE;
  });

  const [editorFontSize, setEditorFontSizeState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.EDITOR_FONT_SIZE);
    return stored ? parseInt(stored, 10) : DEFAULT_VALUES.EDITOR_FONT_SIZE;
  });

  // Apply UI font size to CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${uiFontSize}px`
    );
  }, [uiFontSize]);

  const setUIFontSize = (size: number) => {
    setUIFontSizeState(size);
    localStorage.setItem(STORAGE_KEYS.UI_FONT_SIZE, size.toString());
  };

  const setEditorFontSize = (size: number) => {
    setEditorFontSizeState(size);
    localStorage.setItem(STORAGE_KEYS.EDITOR_FONT_SIZE, size.toString());
  };

  return (
    <AppearanceContext.Provider
      value={{
        uiFontSize,
        editorFontSize,
        setUIFontSize,
        setEditorFontSize,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}
