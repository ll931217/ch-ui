---
status: implemented
priority: 2
assignee: autonomous-maestro
created: 2026-02-02
updated: 2026-02-02
completed: 2026-02-02
epic: UI/UX Enhancement
related_issues: [ch-ui-ehe, ch-ui-3sv, ch-ui-tzf, ch-ui-w82, ch-ui-ck5, ch-ui-sx0, ch-ui-1y9, ch-ui-ebg, ch-ui-8wu]
---

# PRD: Appearance Settings Tab

## Overview

Implement a comprehensive Appearance settings tab in the CH-UI settings page, providing users with fine-grained control over visual presentation including themes and font sizes.

## Goals

1. **Theme Customization**: Enable users to switch between multiple theme variants (Light, Dark, High Contrast Light, High Contrast Dark)
2. **Font Size Control**: Provide independent font size adjustment for UI components and Monaco editor
3. **Instant Feedback**: Apply all appearance changes immediately without requiring save/apply actions
4. **Persistence**: Store user preferences in localStorage for session continuity
5. **Accessibility**: Support WCAG-compliant high-contrast themes and wide font size range (8-32px)

## User Stories

### Theme Selection
- **As a user**, I want to switch between light and dark themes so that I can work comfortably in different lighting conditions
- **As a user with visual impairments**, I want high-contrast theme options for better readability
- **As a user**, I want my theme preference to persist across sessions

### Font Size Customization
- **As a user**, I want to adjust the UI font size independently from the editor font size
- **As a user with vision challenges**, I want a wide range of font sizes (8-32px) for optimal readability
- **As a user**, I want to see font size changes applied immediately as I adjust the slider

## Requirements

### Functional Requirements

#### FR-1: Tabbed Settings Interface
- Convert Settings page to use tabs component
- Initial tabs: "General" (existing content), "Appearance" (new)
- Tab state should persist in URL or local state

#### FR-2: Theme Management
- Extend existing ThemeProvider to support 4 theme variants:
  - Light (default light theme)
  - Dark (default dark theme)
  - High Contrast Light (WCAG AAA compliant)
  - High Contrast Dark (WCAG AAA compliant)
- Theme selector dropdown in Appearance tab
- Immediate theme application on selection
- Persist theme choice to localStorage (existing behavior)

#### FR-3: Font Size Controls
- Two independent font size sliders:
  1. **UI Font Size**: Controls application UI text (8-32px, default 14px)
  2. **Editor Font Size**: Controls Monaco editor text (8-32px, default 14px)
- Display current pixel value next to each slider
- Live preview as user drags slider
- Persist both values to localStorage

#### FR-4: UI Font Size Application
- Create AppearanceContext for global font size state
- Apply UI font size via CSS custom property (--font-size-base)
- Ensure all UI components respect the custom property
- Exclude Monaco editor from UI font size changes

#### FR-5: Editor Font Size Application
- Update Monaco editor options when editor font size changes
- Ensure all editor instances (workspace tabs) reflect new font size
- Integrate with existing monacoConfig.ts

### Non-Functional Requirements

#### NFR-1: Performance
- Theme switching should complete in < 100ms
- Font size changes should apply without layout thrashing
- No perceptible lag when adjusting sliders

#### NFR-2: Accessibility
- All controls must be keyboard navigable
- Sliders must have proper ARIA labels
- High contrast themes must meet WCAG AAA standards (7:1 contrast ratio)
- Focus indicators must be visible in all themes

#### NFR-3: Browser Compatibility
- Support Chrome, Firefox, Safari, Edge (latest 2 versions)
- Gracefully handle missing localStorage support

## Technical Design

### Component Architecture

```
Settings.tsx (refactored)
├── Tabs
│   ├── General Tab
│   │   ├── ConnectionManager
│   │   └── LocalDataCard
│   └── Appearance Tab
│       ├── ThemeSelector
│       ├── UIFontSizeSlider
│       └── EditorFontSizeSlider
```

### State Management

#### AppearanceContext
```typescript
interface AppearanceSettings {
  uiFontSize: number;
  editorFontSize: number;
  setUIFontSize: (size: number) => void;
  setEditorFontSize: (size: number) => void;
}
```

#### Storage Keys
- `vite-ui-theme`: Theme selection (existing)
- `ch-ui-font-size`: UI font size
- `ch-ui-editor-font-size`: Editor font size

### Theme Implementation

#### CSS Custom Properties Approach
```css
/* themes.css */
:root {
  /* Light theme (default) */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... existing variables ... */
}

.dark {
  /* Dark theme (existing) */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}

.high-contrast-light {
  /* High contrast light theme */
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 220 100% 30%;
  /* WCAG AAA compliant colors */
}

.high-contrast-dark {
  /* High contrast dark theme */
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --primary: 210 100% 70%;
  /* WCAG AAA compliant colors */
}
```

### Font Size Implementation

#### UI Font Size
```css
:root {
  --font-size-base: 14px;
}

body {
  font-size: var(--font-size-base);
}
```

#### Editor Font Size
```typescript
// monacoConfig.ts integration
import { useAppearance } from '@/contexts/AppearanceContext';

const { editorFontSize } = useAppearance();

monaco.editor.updateOptions({
  fontSize: editorFontSize
});
```

## UI/UX Specifications

### Appearance Tab Layout

```
┌─────────────────────────────────────────────┐
│ Settings                                     │
├─────────────────────────────────────────────┤
│ [General] [Appearance]                       │
├─────────────────────────────────────────────┤
│                                              │
│ ┌─────────────────────────────────────┐    │
│ │ Theme                                │    │
│ │                                      │    │
│ │ [▼ Dark               ]              │    │
│ │ ├─ Light                             │    │
│ │ ├─ Dark                              │    │
│ │ ├─ High Contrast Light               │    │
│ │ └─ High Contrast Dark                │    │
│ │                                      │    │
│ │ Select your preferred color theme    │    │
│ └─────────────────────────────────────┘    │
│                                              │
│ ┌─────────────────────────────────────┐    │
│ │ Font Sizes                           │    │
│ │                                      │    │
│ │ UI Font Size                         │    │
│ │ [━━━━━●━━━━━━━━━━━━━] 14px          │    │
│ │ 8                              32    │    │
│ │                                      │    │
│ │ Editor Font Size                     │    │
│ │ [━━━━━●━━━━━━━━━━━━━] 14px          │    │
│ │ 8                              32    │    │
│ │                                      │    │
│ │ Adjust font sizes for interface      │    │
│ │ and code editor                      │    │
│ └─────────────────────────────────────┘    │
│                                              │
└─────────────────────────────────────────────┘
```

### Visual Design Tokens

#### Spacing
- Section vertical spacing: 24px (space-y-6)
- Card internal padding: 24px (p-6)
- Control spacing: 16px (space-y-4)

#### Typography
- Section title: text-2xl font-bold
- Card description: text-sm text-muted-foreground
- Slider labels: text-sm font-medium

## Implementation Plan

### Phase 1: Foundation (Tasks 1-3)
1. Create AppearanceContext and provider
2. Add theme CSS custom properties for high-contrast variants
3. Refactor Settings page to use Tabs component

### Phase 2: Theme System (Task 4-5)
4. Extend ThemeProvider to support 4 theme types
5. Build ThemeSelector component in Appearance tab
6. Test theme switching across all pages

### Phase 3: Font Size Controls (Tasks 6-8)
7. Build FontSizeSlider component (reusable)
8. Implement UI font size with CSS custom property
9. Integrate editor font size with Monaco configuration
10. Test font size changes in workspace

### Phase 4: Polish & Testing (Tasks 9-10)
11. Add keyboard navigation and ARIA labels
12. Test accessibility (contrast ratios, screen readers)
13. Browser compatibility testing
14. Update documentation

## Success Criteria

- [ ] All 4 theme variants render correctly across all pages
- [ ] Theme selection persists across browser sessions
- [ ] UI font size changes apply to all UI components (except editor)
- [ ] Editor font size changes apply to all Monaco editor instances
- [ ] Font size range 8-32px works without layout issues
- [ ] All controls are keyboard accessible
- [ ] High contrast themes meet WCAG AAA standards
- [ ] No console errors or warnings
- [ ] Settings persist in localStorage
- [ ] Changes apply immediately without page refresh

## Out of Scope

- Custom theme creation/editing (future enhancement)
- Font family selection (future enhancement)
- Line height customization (future enhancement)
- Theme preview (future enhancement)
- Import/export settings (future enhancement)

## Additional Appearance Settings (Suggested)

Based on common IDE/editor preferences, consider these for future iterations:

1. **Compact Mode**: Reduce padding/spacing for smaller screens
2. **Line Height**: Adjust spacing between lines in editor (1.0-2.0)
3. **Font Family**: Choose from monospace fonts (e.g., 'Fira Code', 'JetBrains Mono')
4. **Ligatures**: Enable/disable font ligatures in editor
5. **Minimap**: Show/hide Monaco editor minimap
6. **Word Wrap**: Enable/disable word wrapping in editor
7. **Sidebar Position**: Left/Right sidebar placement
8. **Icon Theme**: Different icon sets for file explorer
9. **Transparency/Blur**: Window transparency effects (if supported)
10. **Animation Speed**: Control transition/animation duration
11. **Cursor Style**: Block/Line/Underline cursor in editor
12. **Bracket Colorization**: Color-coded bracket pairs
13. **Indentation Guides**: Show/hide indentation lines

## Dependencies

- Existing ThemeProvider (/src/components/common/theme-provider.tsx)
- Existing Monaco editor configuration (/src/features/workspace/editor/monacoConfig.ts)
- shadcn/ui Tabs component (may need to add)
- shadcn/ui Slider component (may need to add)
- shadcn/ui Select component (existing)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Monaco editor doesn't respect font size changes | High | Use Monaco's updateOptions API; test in existing workspace |
| High-contrast themes break existing components | Medium | Test all pages systematically; use CSS custom properties carefully |
| Font size changes cause layout shifts | Medium | Use CSS containment; test with various font sizes |
| localStorage quota exceeded | Low | Settings are small; implement fallback to defaults |

## Timeline Estimate

- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 3-4 hours
- Phase 4: 1-2 hours

**Total: 8-12 hours** (conservative estimate for autonomous implementation)

## Approval

- [x] Requirements validated with user
- [x] Technical approach reviewed
- [x] Ready for implementation

---

**Version History**
- v1 (2026-02-02): Initial PRD with user requirements
