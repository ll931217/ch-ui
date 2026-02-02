---
status: approved
priority: 1
assignee: autonomous-maestro
created: 2026-02-02
updated: 2026-02-02
epic: UI/UX Enhancement
related_issues: []
---

# PRD: Replace Generic Themes with Popular Theme Presets

## Overview

Replace the current generic high-contrast themes with well-established, popular theme presets from the developer community. Implement 8 carefully curated themes (4 dark, 4 light) with authentic color palettes.

## Goals

1. **Community Favorites**: Implement themes that developers know and love
2. **Authentic Palettes**: Use official color schemes from theme maintainers
3. **Visual Preview**: Show color swatches in theme selector for easy identification
4. **Consistent Experience**: Ensure themes work across UI and Monaco editor
5. **System Integration**: Maintain OS-preference auto-switching capability
6. **Font Customization**: Allow users to select from popular coding fonts for the editor

## User Stories

### Theme Selection
- **As a developer**, I want to use Dracula theme so that I have the familiar purple/pink palette I use in VS Code
- **As a user**, I want to see color previews in the theme selector so I can quickly identify themes visually
- **As a light theme user**, I want GitHub Light theme for a clean, professional look
- **As a user**, I want System theme to auto-switch based on my OS dark mode setting

### Font Customization
- **As a developer**, I want to use JetBrains Mono with ligatures for better code readability
- **As a user**, I want to choose from popular coding fonts that I'm familiar with
- **As a user**, I want my font choice to persist across sessions

## Requirements

### Functional Requirements

#### FR-1: Dark Theme Implementations
Implement 4 dark themes with accurate color palettes:

1. **Dracula**
   - Official palette from draculatheme.com
   - Signature colors: Purple (#BD93F9), Pink (#FF79C6), Cyan (#8BE9FD)
   - Background: #282A36, Foreground: #F8F8F2

2. **Nord**
   - Official palette from nordtheme.com
   - Arctic blue tones: #88C0D0, #81A1C1, #5E81AC
   - Background: #2E3440, Foreground: #ECEFF4

3. **Gruvbox Dark**
   - Official palette from github.com/morhetz/gruvbox
   - Warm retro colors: Orange (#FE8019), Yellow (#FABD2F), Green (#B8BB26)
   - Background: #282828, Foreground: #EBDBB2

4. **Tokyo Night**
   - Official palette from github.com/enkia/tokyo-night-vscode-theme
   - Neon night colors: Blue (#7AA2F7), Magenta (#BB9AF7), Cyan (#7DCFFF)
   - Background: #1A1B26, Foreground: #C0CAF5

#### FR-2: Light Theme Implementations
Implement 4 light themes with accurate color palettes:

1. **GitHub Light**
   - Official GitHub.com light theme
   - Clean, professional: Blue (#0969DA), Green (#1A7F37)
   - Background: #FFFFFF, Foreground: #24292F

2. **Gruvbox Light**
   - Light variant of Gruvbox
   - Warm cream: Orange (#AF3A03), Yellow (#B57614), Green (#79740E)
   - Background: #FBF1C7, Foreground: #3C3836

3. **Catppuccin Latte**
   - Official Catppuccin light variant
   - Pastel colors: Lavender (#7287FD), Pink (#EA76CB), Teal (#179299)
   - Background: #EFF1F5, Foreground: #4C4F69

4. **One Light**
   - Atom's popular light theme
   - Soft colors: Blue (#4078F2), Orange (#C18401), Green (#50A14F)
   - Background: #FAFAFA, Foreground: #383A42

#### FR-3: System Theme
- Maintain existing "System" option
- Auto-detect OS dark mode preference
- Default to GitHub Light (light) or Dracula (dark) based on OS

#### FR-4: Theme Selector UI with Color Swatches
- Display 3 representative color dots before each theme name
- Dots show primary, secondary, and accent colors
- Visual identification without reading text
- Grouped by light/dark with divider

#### FR-5: Monaco Editor Theme Mapping
- Map each theme to appropriate Monaco theme:
  - Light themes → `vs-light`
  - Dark themes → `vs-dark`
- Future: Custom Monaco themes per palette (out of scope for v1)

#### FR-6: Font Family Selection (Editor Only)
Implement dropdown with popular coding fonts:
1. **System Default** - Use browser/system monospace
2. **JetBrains Mono** - Popular with ligatures support
3. **Fira Code** - Classic with extensive ligatures
4. **Cascadia Code** - Microsoft's font with ligatures
5. **Source Code Pro** - Adobe's open-source font
6. **Monaco** - macOS terminal font
7. **Consolas** - Windows terminal font
8. **IBM Plex Mono** - IBM's corporate font

Features:
- Font preview in dropdown (show font name in its own font)
- Ligatures enabled by default for supporting fonts
- Fallback to monospace if font not available
- Persist selection in localStorage
- Apply only to Monaco editor (not UI)

### Non-Functional Requirements

#### NFR-1: Color Accuracy
- Use official hex codes from theme maintainers
- Verify against official repositories/websites
- Maintain color relationships (contrast ratios)

#### NFR-2: Performance
- No performance degradation from theme switching
- Instant preview in selector dropdown

#### NFR-3: Accessibility
- All themes meet WCAG AA standards minimum (4.5:1 contrast)
- Dracula, Nord, Gruvbox already WCAG AAA compliant

## Technical Design

### Theme Color Palettes

#### Dracula
```css
.dracula {
  --background: 225 15% 20%;        /* #282A36 */
  --foreground: 60 30% 96%;         /* #F8F8F2 */
  --primary: 265 89% 78%;            /* #BD93F9 */
  --primary-foreground: 225 15% 20%; /* #282A36 */
  --secondary: 225 27% 51%;          /* #6272A4 */
  --accent: 326 100% 74%;            /* #FF79C6 */
  --muted: 232 14% 31%;              /* #44475A */
  --border: 232 14% 31%;             /* #44475A */
  --destructive: 0 100% 67%;         /* #FF5555 */
}
```

#### Nord
```css
.nord {
  --background: 220 16% 22%;         /* #2E3440 */
  --foreground: 218 27% 94%;         /* #ECEFF4 */
  --primary: 193 43% 67%;            /* #88C0D0 */
  --secondary: 220 16% 36%;          /* #4C566A */
  --accent: 210 34% 63%;             /* #81A1C1 */
  --muted: 220 17% 32%;              /* #3B4252 */
  --border: 220 17% 32%;             /* #3B4252 */
  --destructive: 354 42% 56%;        /* #BF616A */
}
```

#### Gruvbox Dark
```css
.gruvbox-dark {
  --background: 0 0% 16%;            /* #282828 */
  --foreground: 43 16% 87%;          /* #EBDBB2 */
  --primary: 32 93% 58%;             /* #FE8019 */
  --secondary: 40 56% 55%;           /* #D79921 */
  --accent: 66 58% 45%;              /* #B8BB26 */
  --muted: 0 0% 27%;                 /* #3C3836 */
  --border: 0 0% 27%;                /* #3C3836 */
  --destructive: 0 59% 48%;          /* #CC241D */
}
```

#### Tokyo Night
```css
.tokyo-night {
  --background: 230 23% 13%;         /* #1A1B26 */
  --foreground: 224 18% 77%;         /* #C0CAF5 */
  --primary: 217 92% 76%;            /* #7AA2F7 */
  --secondary: 215 28% 35%;          /* #3B4261 */
  --accent: 267 76% 76%;             /* #BB9AF7 */
  --muted: 235 16% 19%;              /* #24283B */
  --border: 235 16% 19%;             /* #24283B */
  --destructive: 0 90% 67%;          /* #F7768E */
}
```

#### GitHub Light
```css
.github-light {
  --background: 0 0% 100%;           /* #FFFFFF */
  --foreground: 213 15% 15%;         /* #24292F */
  --primary: 212 92% 43%;            /* #0969DA */
  --secondary: 210 18% 87%;          /* #D8DEE4 */
  --accent: 137 55% 36%;             /* #1A7F37 */
  --muted: 210 18% 96%;              /* #F6F8FA */
  --border: 214 18% 87%;             /* #D0D7DE */
  --destructive: 356 72% 48%;        /* #CF222E */
}
```

#### Gruvbox Light
```css
.gruvbox-light {
  --background: 48 87% 88%;          /* #FBF1C7 */
  --foreground: 24 13% 24%;          /* #3C3836 */
  --primary: 17 100% 34%;            /* #AF3A03 */
  --secondary: 36 66% 40%;           /* #B57614 */
  --accent: 60 56% 25%;              /* #79740E */
  --muted: 47 59% 85%;               /* #EBDBB2 */
  --border: 45 25% 74%;              /* #BDAE93 */
  --destructive: 0 73% 35%;          /* #9D0006 */
}
```

#### Catppuccin Latte
```css
.catppuccin-latte {
  --background: 220 23% 95%;         /* #EFF1F5 */
  --foreground: 234 16% 35%;         /* #4C4F69 */
  --primary: 234 82% 63%;            /* #7287FD */
  --secondary: 228 15% 76%;          /* #BCC0CC */
  --accent: 179 62% 35%;             /* #179299 */
  --muted: 223 16% 83%;              /* #CCD0DA */
  --border: 228 15% 76%;             /* #BCC0CC */
  --destructive: 347 87% 44%;        /* #D20F39 */
}
```

#### One Light
```css
.one-light {
  --background: 0 0% 98%;            /* #FAFAFA */
  --foreground: 230 8% 24%;          /* #383A42 */
  --primary: 220 100% 60%;           /* #4078F2 */
  --secondary: 230 1% 90%;           /* #E5E5E6 */
  --accent: 115 54% 48%;             /* #50A14F */
  --muted: 0 0% 96%;                 /* #F5F5F5 */
  --border: 0 0% 87%;                /* #DEDEDE */
  --destructive: 5 74% 59%;          /* #E45649 */
}
```

### Component Architecture

#### Theme Selector with Swatches
```tsx
<Select value={theme} onValueChange={setTheme}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Dark Themes</SelectLabel>
      <SelectItem value="dracula">
        <ThemePreview colors={['#BD93F9', '#FF79C6', '#8BE9FD']} />
        Dracula
      </SelectItem>
      {/* ... other dark themes */}
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Light Themes</SelectLabel>
      {/* ... light themes */}
    </SelectGroup>
  </SelectContent>
</Select>
```

#### ThemePreview Component
```tsx
function ThemePreview({ colors }: { colors: string[] }) {
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
```

### Storage & Migration

#### localStorage Key
- Existing: `vite-ui-theme`
- Values: `"dracula"` | `"nord"` | `"gruvbox-dark"` | `"tokyo-night"` | `"github-light"` | `"gruvbox-light"` | `"catppuccin-latte"` | `"one-light"` | `"system"`

#### Migration Strategy
- Users with `"light"` → migrate to `"github-light"`
- Users with `"dark"` → migrate to `"dracula"`
- Users with `"high-contrast-light"` → migrate to `"one-light"`
- Users with `"high-contrast-dark"` → migrate to `"dracula"`

## Implementation Plan

### Phase 1: Research & Documentation
1. Verify official color palettes from source repositories
2. Document hex codes and HSL conversions
3. Create color swatch reference

### Phase 2: CSS Theme Replacement
1. Remove high-contrast theme CSS
2. Add 8 new theme CSS blocks
3. Update CSS variant declarations
4. Verify chart colors for each theme

### Phase 3: TypeScript & Components
1. Update Theme type definition
2. Update ThemeProvider classList logic
3. Create ThemePreview component
4. Update AppearanceTab UI

### Phase 4: Monaco Integration
1. Update SqlEditor theme mapping
2. Test editor syntax highlighting in each theme
3. Ensure proper contrast in all themes

### Phase 5: Testing & Migration
1. Test all themes across pages
2. Implement localStorage migration
3. Test System theme auto-switching
4. Verify color accuracy

## Success Criteria

- ✅ All 8 themes render correctly with official color palettes
- ✅ Color swatches display in theme selector
- ✅ System theme auto-switches based on OS preference
- ✅ All themes meet WCAG AA minimum (4.5:1 contrast)
- ✅ Monaco editor themes map correctly
- ✅ Existing user preferences migrate gracefully
- ✅ No visual regressions on any page
- ✅ Theme switching is instant (<100ms)

## Out of Scope

- Custom Monaco themes per palette (future v2)
- User-created custom themes (future)
- Theme editor/customizer (future)
- Additional theme variants (One Dark, Solarized, etc.)

## References

- Dracula: https://draculatheme.com/contribute
- Nord: https://www.nordtheme.com/docs/colors-and-palettes
- Gruvbox: https://github.com/morhetz/gruvbox
- Tokyo Night: https://github.com/enkia/tokyo-night-vscode-theme
- GitHub: https://primer.style/primitives/colors
- Catppuccin: https://github.com/catppuccin/catppuccin
- One Light: https://github.com/atom/atom/tree/master/packages/one-light-syntax

## Approval

- [x] Requirements validated
- [x] Color palettes researched
- [x] Technical approach reviewed
- [x] Ready for autonomous implementation

---

**Version History**
- v1 (2026-02-02): Initial PRD with 8 popular themes
