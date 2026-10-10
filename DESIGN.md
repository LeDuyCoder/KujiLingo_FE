---
name: KujiLingo
description: A clear, encouraging study interface for learning Japanese step by step.
colors:
  primary: "#b7152b"
  primary-hover: "#a01226"
  primary-soft: "#fef2f2"
  neutral-bg: "#ffffff"
  neutral-ink: "#171717"
  neutral-strong: "#18181b"
  neutral-muted: "#71717a"
  neutral-border: "#e4e4e7"
  neutral-subtle: "#fafafa"
  success: "#10b981"
  warning: "#f59e0b"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, M PLUS 1p, Noto Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Be Vietnam Pro, M PLUS 1p, Noto Sans, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Be Vietnam Pro, M PLUS 1p, Noto Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Be Vietnam Pro, M PLUS 1p, Noto Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  control: "12px"
  card: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 20px"
  button-outline:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-strong}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 20px"
  input-default:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 16px"
  navigation-item:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-muted}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  card-default:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  status-chip:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    height: "24px"
    padding: "3px 10px"
---

# Design System: KujiLingo

## 1. Overview

**Creative North Star: "The Red Thread Study Desk"**

KujiLingo’s web product is a clear place to study, review, and find the next useful lesson. Be Vietnam Pro anchors Vietnamese interface copy, while M PLUS 1p and Noto Sans complete the configured sans fallback stack. The visual language is familiar and compact: a white canvas, cool zinc neutrals, a restrained crimson accent, and recognizable controls.

The red thread marks primary actions, selected navigation, and meaningful progress. It should guide attention through a study task, not turn the interface into a scoreboard. Keep lesson content ahead of streaks and rewards; avoid pressure, gamification that distracts from learning, and clutter that hides the next action.

This spec documents the implemented web product UI. The public landing page can adapt the same brand colors and type while using its own brand register. The mobile app currently contains Expo starter screens and theme primitives, not a KujiLingo component system; use this spec as its product direction until native screens establish their own patterns.

**Key Characteristics:**
- A light, readable canvas with cool neutral structure.
- Kuji Crimson reserved for actions, selection, links, and important progress.
- Familiar controls with compact labels and clear interaction states.
- Learning progress is visible without making missed days feel like failure.

## 2. Colors

The web product pairs a single crimson action color with white and cool zinc neutrals; amber and green communicate supporting states.

### Primary
- **Kuji Crimson**: the primary action, selected navigation, links, and key progress indicator. Use its darker hover value for pointer feedback, not as a second accent.

### Neutral
- **Study White**: the page and control surface.
- **Ink**: base text and high-priority content.
- **Zinc Ink**: headings and strong interface text.
- **Muted Zinc**: secondary descriptions and inactive labels; keep body copy at accessible contrast.
- **Zinc Border**: field outlines, separators, and quiet card edges.
- **Soft Zinc**: low-emphasis input and hover surfaces.
- **Practice Green**: success and completed practice states.
- **Warm Amber**: streak and attention states. Do not use it to imply failure or urgency by default.

**The Red Thread Rule.** Use crimson to point to an action or a meaningful state. Do not use it as decoration across large inactive surfaces.

## 3. Typography

**Display Font:** Be Vietnam Pro (with M PLUS 1p and Noto Sans fallbacks)
**Body Font:** Be Vietnam Pro (with M PLUS 1p and Noto Sans fallbacks)
**Label/Mono Font:** No distinct label or mono family is established in the web product.

**Character:** A single sans-led system keeps Vietnamese UI copy direct and supports Japanese study content. Use weight and size for hierarchy; keep labels compact without making them faint or overly tracked.

### Hierarchy
- **Headline** (700, 24px, 1.2): page titles; increase to 30px at the medium breakpoint where the layout has room.
- **Title** (700, 20px, 1.3): lesson names and section headings.
- **Body** (400, 16px, 1.5): instructional copy and supporting explanations.
- **Label** (600, 14px, 1.35): field labels and navigation; compact metadata may step down to 12px when it remains readable.

**The Utility Type Rule.** Keep product UI in the established sans stack. Do not use display faces for labels, buttons, or data.

## 4. Elevation

The product uses borders and neutral surface shifts to define cards and fields. Small shadows may separate a card on hover; reserve stronger shadows for overlays such as the mobile navigation drawer and dialogs. Avoid pairing a decorative wide shadow with a thin border on ordinary controls.

### Shadow Vocabulary
- **Resting surface** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): a light boundary for learning cards that need separation from the page.
- **Interactive surface** (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): a restrained hover lift on a card that is itself interactive.
- **Overlay** (`0 25px 50px -12px rgb(0 0 0 / 0.25)`): a drawer or dialog above the app surface.

**The Surface-First Rule.** Establish hierarchy with spacing, type, and borders first; use stronger shadows only when a layer must sit above another.

## 5. Components

### Buttons
- **Character:** Familiar and direct, with a clear primary action.
- **Shape:** Full pill for the shared button primitive; 48px high with 20px horizontal padding.
- **Primary:** Kuji Crimson with white text; medium weight. Hover darkens the fill; active feedback uses a subtle scale change.
- **Secondary / Ghost:** White with a zinc outline, or transparent with a quiet zinc hover surface. Preserve the same height and type scale.
- **Focus:** Provide a visible keyboard focus ring with sufficient contrast; do not rely on color change alone.

### Chips
- **Style:** Compact pill with a pale red or semantic state tint and a strong readable label.
- **State:** Use crimson for selected or primary context, green for completed practice, and amber for streak context. Pair color with text or an icon.

### Cards / Containers
- **Corner Style:** Generous 24px corners are common in existing dashboard learning cards; use the smaller 16px range for denser data panels.
- **Background:** White, with a fine cool-neutral border where the card needs a boundary.
- **Shadow Strategy:** A light resting shadow; stronger elevation only for interactive hover or overlays.
- **Internal Padding:** 24px for dashboard cards; 16px for compact rows and nested content.

### Inputs / Fields
- **Style:** White fill, 1px zinc border, 12px radius, 48px height, and 16px horizontal padding.
- **Focus:** Shift the border to Kuji Crimson and show a clear focus ring.
- **Error / Disabled:** Use explicit text and state styling; preserve readable contrast and do not communicate the state with color alone.

### Navigation
- **Style:** Compact sans labels, 44px minimum row height, 12px corners, and a quiet neutral inactive state.
- **Active:** Pale red surface with Kuji Crimson text and icon; include a non-color cue such as the selected label/state.
- **Mobile:** The web dashboard uses a slide-in drawer below the large breakpoint. Native mobile navigation is not yet represented by KujiLingo-specific screens.

### Learning Progress
Show lesson progress and review status close to the next study action. Keep streaks and rewards secondary, with calm copy that encourages return without guilt.

## 6. Do's and Don'ts

### Do:
- **Do** use the established crimson for primary actions and selected states, with white and zinc neutrals around it.
- **Do** make the next lesson or review action easy to find.
- **Do** keep body text readable, preserve visible keyboard focus, support reduced motion, and pair color states with text or icons.
- **Do** use borders and spacing before stronger shadows; keep state transitions short and purposeful.
- **Do** let lesson content lead; use progress indicators to support learning.

### Don't:
- **Don't** make learners feel pressured or guilty about missed study days or streaks.
- **Don't** let gamification compete with or distract from learning.
- **Don't** add clutter that obscures the next useful learning action.
- **Don't** use display fonts in product labels, buttons, or data.
- **Don't** use crimson as decoration across large inactive surfaces or depend on color alone to convey state.
