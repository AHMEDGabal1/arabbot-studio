---
name: ArabBot Studio
description: WhatsApp bot management dashboard with AI-powered conversations
colors:
  primary: "oklch(0.58 0.18 50)"
  primary-light: "oklch(0.63 0.18 50)"
  primary-deep: "oklch(0.46 0.18 50)"
  primary-faint: "oklch(0.96 0.02 50)"
  gold-accent: "oklch(0.72 0.16 85)"
  gold-deep: "oklch(0.50 0.16 85)"
  dark-surface: "oklch(0.04 0.008 270)"
  dark-elevated: "oklch(0.07 0.010 270)"
  dark-card: "oklch(0.10 0.012 270)"
  dark-border: "oklch(0.14 0.012 270)"
  dark-muted: "oklch(0.18 0.012 270)"
  dark-dim: "oklch(0.30 0.010 270)"
  dark-dim-light: "oklch(0.42 0.008 270)"
  warm-bg: "oklch(1 0 0)"
  warm-card: "oklch(0.97 0.004 55)"
  warm-border: "oklch(0.88 0.006 55)"
  warm-border-light: "oklch(0.94 0.006 55)"
  warm-border-deep: "oklch(0.68 0.010 55)"
  neutral-mid: "oklch(0.85 0.005 50)"
  neutral-text: "oklch(0.58 0.006 50)"
  neutral-text-deep: "oklch(0.46 0.008 50)"
  neutral-text-dim: "oklch(0.36 0.008 50)"
  neutral-text-dark: "oklch(0.28 0.008 50)"
  success-bg: "oklch(0.96 0.03 150)"
  success: "oklch(0.55 0.14 150)"
  success-deep: "oklch(0.45 0.14 150)"
  error-bg: "oklch(0.96 0.03 25)"
  error: "oklch(0.50 0.20 25)"
  error-deep: "oklch(0.40 0.20 25)"
typography:
  display:
    fontFamily: "'Space Grotesk', sans-serif"
    fontWeight: 600
  body:
    fontFamily: "'DM Sans', sans-serif"
    fontWeight: 400
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{dark-card}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{dark-border}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{neutral-text-dim}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1.25rem"
  input:
    backgroundColor: "{warm-card}"
    textColor: "{dark-surface}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  card:
    backgroundColor: "{warm-card}"
    rounded: "{rounded.lg}"
  badge-active:
    backgroundColor: "#ecfdf5"
    textColor: "#047857"
  badge-inactive:
    backgroundColor: "{neutral-mid}"
    textColor: "{neutral-text}"
---

# Design System: ArabBot Studio

## 1. Overview

**Creative North Star: "The Amber Studio"**

ArabBot Studio lives at the intersection of premium Arabian design and modern tech tooling. The system uses an indigo-tinted near-black shell for the app UI — deep, serious, focused — with rich amber as the voice and warm gold as the accent. The landing and marketing surfaces shift to pure white canvas, letting the amber breathe as ink rather than atmosphere. This is a confident, culturally-rooted platform that serves business owners and developers building Arabic-first WhatsApp bots.

The system explicitly rejects generic SaaS navy-and-blue templates, cold corporate enterprise software, and over-abstracted AI tool UIs with nested card grids.

**Key Characteristics:**
- Indigo-night app shell with warm amber energy
- Pure white marketing canvas — warmth lives in the amber accent, not the surface
- Professional but not cold — warmth through amber, not tinted backgrounds
- Clean hierarchy, purposeful motion, no gratuitous effects
- Strong borders and clear surface separation over shadow-heavy layering

## 2. Colors: The Amber-Indigo Palette

**Palette seed:** `oklch(0.65 0.146 60)` — warm honey/amber
**Direction:** "Premium Arabian tech atelier — warm amber ink on crisp white, with midnight indigo depth. Editorial confidence meets cultural resonance."

The palette is split across two surfaces: a pure white domain (marketing, public pages) and an indigo-tinted near-black domain (app dashboard). Both share the same amber/gold accent DNA.

### Primary: Amber
- **Amber 500** (oklch(0.58 0.18 50)): The voice. Used for primary interactive elements, active nav indicators, hover states. Deeper and more saturated than the seed for confident brand presence. White text on amber fills (Helmholtz-Kohlrausch effect).

### Secondary: Gold
- **Gold 400** (oklch(0.72 0.16 85)): The accent. Used sparingly for decorative highlights, data insights, and warmth without competing with amber.

### Neutral (Dark Domain — Indigo Night)
- **Navy 900** (oklch(0.04 0.008 270)): Deepest background, near-black with subtle indigo tone.
- **Navy 800** (oklch(0.07 0.010 270)): Elevated surfaces, card backgrounds.
- **Navy 700** (oklch(0.10 0.012 270)): Card/surface backgrounds in the app shell.
- **Navy 600** (oklch(0.14 0.012 270)): Border strokes in dark mode.
- **Navy 500** (oklch(0.18 0.012 270)): Muted borders, subtle dividers.
- **Navy 400** (oklch(0.30 0.010 270)): Muted text, secondary labels.
- **Navy 300** (oklch(0.42 0.008 270)): Disabled text, placeholder elements.
- **Sand 50** (oklch(0.97 0.004 55)): Light text on dark surfaces.

### Neutral (Warm Domain — Pure White)
- **Warm BG** (oklch(1 0 0)): Pure white. No hidden warmth. The brand's amber carries the temperature.
- **Warm Card** (oklch(0.97 0.004 55)): Barely-warm white for cards and input backgrounds.
- **Sand 200** (oklch(0.88 0.006 55)): Border color for cards and inputs.
- **Sand 400** (oklch(0.68 0.010 55)): Deeper warm borders, decorative lines.
- **Ash 400** (oklch(0.58 0.006 50)): Body text on warm backgrounds.
- **Ash 500** (oklch(0.46 0.008 50)): Deeper body text.
- **Ash 700** (oklch(0.28 0.008 50)): Near-black warm text for headings.

### Semantic
- **Success** (oklch(0.55 0.14 150)): Positive states, resolved handoffs, active badges.
- **Error** (oklch(0.50 0.20 25)): Destructive actions, error messages, alerts.

### Named Rules
**The One Voice Rule.** Amber is the single voice across both domains. A dark-shell button and a light-shell button both use the same amber — the system's identity is in the accent, not the background.

**The Warmth-Through-Accent Rule.** The indigo shell is intentionally cool and deep. Warmth comes from amber interactive elements and the warm-toned text on dark surfaces, not from tinting the background itself.

**The Pure Canvas Rule.** Marketing surfaces use pure white (oklch(1 0 0)). No warm-tinted cream, no sand-toned paper. The amber accent alone carries the brand's temperature. This follows Stripe/Notion/Linear's approach: the brand color does the work, not the surface.

## 3. Typography

**Display Font:** Space Grotesk (sans-serif), Cairo (Arabic)
**Body Font:** DM Sans (sans-serif), Cairo (Arabic)
**Arabic Font:** Cairo (sans-serif)

**Character:** A confident geometric sans (Space Grotesk) for display hierarchy paired with a warm humanist sans (DM Sans) for body. The pairing leans modern and professional — the display is assertive without being heavy, the body is readable without being clinical.

### Hierarchy
- **Display** (600, clamp(2.5rem, 5vw, 3.75rem), 1.1): Hero headlines only. Letter-spacing: -0.02em to -0.04em. Used sparingly.
- **Headline** (600, clamp(1.5rem, 3vw, 1.875rem), 1.2): Section titles, page headers.
- **Title** (600, 1rem-1.125rem, 1.3): Card titles, component headings.
- **Body** (400, 0.875rem-1rem, 1.6): Primary reading text. Max line length: 65-75ch.
- **Label** (500, 0.75rem-0.8125rem, 1.4, 0.05em tracking, uppercase): Small labels, badges, metadata.

### Named Rules
**The Three-Family Rule.** Space Grotesk carries English display. DM Sans carries English body. Cairo carries all Arabic text. Cairo drops in as the fallback for both font stacks so mixed Latin/Arabic content reads coherently.

**The Arabic-First Layering Rule.** Arabic text always sits visually below English as a design layer — it's the brand's soul, rendered at a larger size and lower opacity so it reads as texture and identity before literal meaning.

## 4. Elevation

The system uses **tonal layering on dark surfaces and shadow-light cards on warm surfaces**. The dark navy shell creates depth through color value shifts (Navy 900 → 800 → 700) rather than shadows. On warm marketing surfaces, cards use a subtle shadow vocabulary for dimensional separation.

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 1px 3px 0 rgba(15,18,25,0.06), 0 1px 2px -1px rgba(15,18,25,0.06)`): Default card state.
- **Card Hover** (`box-shadow: 0 4px 12px 0 rgba(15,18,25,0.08), 0 2px 4px -2px rgba(15,18,25,0.06)`): Raised interactive cards.
- **Card Large** (`box-shadow: 0 8px 24px 0 rgba(15,18,25,0.10), 0 4px 8px -4px rgba(15,18,25,0.06)`): Modals, dialogs.

### Named Rules
**The Layer-Not-Shadow Rule.** In the dark app shell, depth is created through tonal layers of navy, not drop shadows. Shadows only appear on warm-surface cards. Dark-surface cards are distinguished by background value, not blur.

## 5. Components

### Buttons
- **Shape:** Medium rounding (0.5rem / 8px).
- **Primary:** Amber 500 background, white text. Hover shifts to Amber 600 with subtle lift and shadow. Active scales down 0.97. Text is Space Grotesk 0.875rem, 500 weight, 0.08em tracking.
- **Secondary:** Transparent background, Ash 700 text, Sand 200 border. Hover shifts to amber text + border with Amber 50 background.
- **States:** All buttons use a 150ms ease transition. Hover, active, and disabled states explicit. Focus-visible uses a 2px amber outline.

### Cards
- **Corner Style:** Generous rounding (0.75rem / 12px).
- **Background:** Card surface on warm surfaces, Navy 700 on dark surfaces.
- **Border:** Sand 200 on warm surfaces; none on dark surfaces (tonal layering).
- **Shadow:** Subtle card shadow at rest (see Elevation). Hover lifts card 2px with enhanced shadow.
- **Internal Padding:** 1.25rem-1.5rem (20-24px).

### Inputs / Fields
- **Style:** Card surface background, Sand 200 border, 0.5rem radius.
- **Focus:** Border shifts to Amber 400 with a 3px amber glow ring (oklch(0.58 0.18 50 / 0.15)).
- **Placeholder:** Ash 300. Always meets 4.5:1 contrast.
- **Padding:** 0.75rem 1rem (12px 16px).

### Badges
- **Style:** Pill shape (9999px radius), 0.75rem font, 500 weight.
- **Active:** Green tint for active/live states.
- **Inactive:** Ash 100 background, Ash 500 text for paused/stopped states.
- **Handoff:** Gold tint for human handoff indicator.

### Navigation (Sidebar)
- **Style:** Fixed left sidebar, solid navy-900 background. 280px width. Brand logo in amber block.
- **Items:** Navy 400 text default, Amber 500 active state with left bar indicator. Active item gets a subtle amber background tint (10%) and border (20%).
- **Hover:** Text shifts to Sand 50, icon scales up 1.1x with -0.5rem Y lift.

## 6. Do's and Don'ts

> **Note on naming:** The code uses `terracotta` as the token namespace for amber (legacy name kept for continuity). All visual references to "terracotta" mean the amber family defined above.

### Do:
- **Do** use amber as the primary action color — buttons, active states, and brand marks carry it boldly.
- **Do** use tonal layering (Navy 900 → 800 → 700) rather than shadows in the dark app shell.
- **Do** use pure white (oklch(1 0 0)) as the marketing canvas — no warm-tinted backgrounds unless the brief explicitly requires an environmental mood.
- **Do** keep body text readable: Ash 400 or darker on warm surfaces, Navy 300 or lighter on dark surfaces.
- **Do** use `text-wrap: balance` on headings, `text-wrap: pretty` on prose.
- **Do** use bold (700) weight on display text for stronger hierarchy contrast.
- **Do** use purposeful motion with ease-out cubic-bezier curves. No bounce, no elastic.
- **Do** respect reduced motion with `@media (prefers-reduced-motion: reduce)` alternatives.
- **Do** use the solid navy-900 sidebar with a crisp right border over glass effects.

### Don't:
- **Don't** use gradient text (`background-clip: text` with a gradient). One solid color.
- **Don't** use numbered section markers (01, 02, 03) as scaffolding above sections.
- **Don't** use tiny uppercase tracked eyebrow above every section as a default scaffold.
- **Don't** wrap everything in cards or nest cards inside cards.
- **Don't** use side-stripe borders (colored `border-left`/`border-right` > 1px) as accent.
- **Don't** use glassmorphism as a default — the sidebar is solid.
- **Don't** use the hero-metric template (big number, small label, gradient accent) as default.
- **Don't** use warm-tinted cream backgrounds for marketing surfaces — pure white is the canvas, amber carries the warmth.
- **Don't** use generic SaaS navy-and-blue templates or cold corporate enterprise styling.
- **Don't** use Inter, Arial, or system defaults as display fonts.
- **Don't** use bounce/elastic easing curves.
- **Don't** use arbitrary z-index values like 999 or 9999 — use a semantic scale.
