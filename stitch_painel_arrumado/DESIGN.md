---
name: KiEstudos Elite Civil Prep
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bcc9ce'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#869398'
  outline-variant: '#3d494d'
  surface-tint: '#4cd6fb'
  primary: '#4cd6fb'
  on-primary: '#003642'
  primary-container: '#00b4d8'
  on-primary-container: '#00414f'
  inverse-primary: '#00677d'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#76a4ff'
  on-tertiary-container: '#00387e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b3ebff'
  primary-fixed-dim: '#4cd6fb'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#004e5f'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system defines an elite, performance-driven dark ecosystem built specifically for civil service exam candidates (concurseiros de alta performance). The interface communicates discipline, cognitive endurance, surgical precision, and academic mastery. It eliminates digital fatigue during grueling 8-to-12-hour study cycles while providing high-contrast micro-rewards and instant feedback.

The aesthetic fuses **Tactile Modern Dark Minimalist** with **Cybernetic Glow / Neo-Fintech Glass**. The visual hierarchy relies on deep obsidian navy layers (`#0B0F17` to `#161F30`), crisp structural hairline borders (`#2D3748` / `#334155`), and vibrant bioluminescent gradients bridging electric cyan (`#00B4D8`), cobalt blue (`#3B82F6`), and emerald mint (`#10B981` / `#00F5D4`). Interactive targets, pill tags, and segmented toggles offer distinct physical presence with crisp tactile states.

## Colors
The system employs a layered dark architecture designed to maintain high legibility and contrast under prolonged screen exposure.

### Primary, Accent & Functional Roles
- **Primary Accent (`#00B4D8`)**: Electric Cyan. Used for active navigation pills, focus borders, primary progress arcs, and dynamic link triggers.
- **Secondary Accent (`#10B981` / `#00F5D4`)**: Mint & Emerald. Applied to high-intent primary CTA buttons (such as "Começar Simulado"), success states, accuracy rates, and vertical progress meters.
- **Tertiary Accent (`#3B82F6`)**: Vivid Cobalt. Anchors gradients, active card badges, timer indicators, and analytical metrics.
- **Warning & Highlight**: Amber (`#F59E0B`) for VIP flags and PRO tags; Rose/Red (`#EF4444`) for error books, weak subjects, and timer expiration alerts.

### Dark Surface Architecture
- **Base Canvas (`#0B0F17`)**: Deepest abyss canvas; eliminates backlight glare.
- **Sidebar & Surface Base (`#111827`)**: Grounded background for persistent navigation, toolbars, and modal backdrops.
- **Container / Card Level 1 (`#161F30`)**: Elevated standard card, exam configurator block, and list module background.
- **Container / Card Level 2 (`#1E293B`)**: Interactive tile background, unselected state pills, segmented toggle surfaces.
- **Active Container (`#23334D`)**: Selected pill state, hover tile illumination.
- **Structural Outlines (`#2D3748` / `#334155`)**: Micro-borders (1px) containing glow falloffs.

### Typography & Icon Tokens
- **Text High-Emphasis (`#F8FAFC`)**: Section headers, active metrics, primary answers.
- **Text Medium-Emphasis (`#94A3B8`)**: Labels, secondary stats, breadcrumb navigation.
- **Text Low-Emphasis (`#64748B`)**: Placeholders, metadata timestamps, inactive indicators.

## Typography
The system balances structural weight and scanning ease:
- **Headlines & Labels (`Plus Jakarta Sans`)**: Delivers geometric authority and contemporary character. Titles are rendered tight (`letterSpacing: -0.02em` to `-0.03em`) with heavy font weights (`700` and `800`) to anchor dashboard screens and mock exam titles.
- **Body Text (`Inter`)**: Chosen for high x-height, neutral tone, and unmatched legibility in dense legal passages, complex exam questions, and comparative answer keys.
- **Metadata & Section Headers (`label-sm`)**: Formatted uppercase with track expansion (`letterSpacing: 0.06em`) in slate tones (`#64748B`) to create rhythm between dashboard groupings like "ESTUDO ATIVO", "PLANEJAMENTO & DESEMPENHO", and "SISTEMA".

## Layout & Spacing
The layout follows a fluid-hybrid desktop layout anchored by a fixed left rail (width `260px` to `280px`) and an expand-and-center canvas for exam simulations and dashboard widgets.

- **Breakpoints**:
  - `Desktop (>= 1280px)`: Fixed persistent navigation rail (`280px`), flexible main viewport constrained to `1200px` max-width with 32px canvas margins. Multi-column test-builder grids (e.g., questions count alongside stopwatch settings).
  - `Tablet (768px - 1279px)`: Sidebar collapses to an icon-only dynamic utility rail (`72px`) or sliding drawer; horizontal card grids stack to 2-columns; margins scale to `24px`.
  - `Mobile (< 768px)`: Navigation shifts to a persistent bottom dock with an off-canvas drawer. All configurator tiles and timer modules collapse into full-width stacked blocks. Spacing shrinks: outer margin `16px`, container gutters `12px`.

Layout density remains compact-to-balanced (`space-md` / 16px standard gap between configuration cards; `space-xs` to `space-sm` inside button pills and chip clusters) to keep mock exam parameters visible above the fold.

## Elevation & Depth
Depth in this dark mode system avoids muddy drop shadows in favor of **Tonal Luminance, Micro-Borders, and Bioluminescent Edge Lighting**:

1. **Surface Elevation Hierarchy**:
   - **Level 0 (Canvas)**: `#0B0F17` flat base.
   - **Level 1 (Panels & Sidebar)**: `#111827` bordered with a 1px stroke of `#1E293B`.
   - **Level 2 (Active Cards & Config Modules)**: `#161F30` bordered by `rgba(51, 65, 85, 0.6)`. Hovering adds a subtle cyan edge highlight (`border-color: rgba(0, 180, 216, 0.4)`).
   - **Level 3 (Interactive Controls & Inputs)**: `#1E293B` sunken or elevated with 1px `rgba(255, 255, 255, 0.05)`.
   - **Level 4 (Popovers, Modals & Dropdowns)**: `#1A2438` with a deep ambient shadow: `0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(59, 130, 246, 0.15)`.

2. **Bioluminescent Micro-Glow**:
   - Active navigation items and primary selection pills generate a localized back-diffusion glow: `box-shadow: 0 4px 20px -2px rgba(0, 180, 216, 0.35)`.
   - CTA execution buttons ("Começar Simulado") carry an energetic mint-to-cyan gradient with ambient glow: `box-shadow: 0 8px 24px -4px rgba(16, 185, 129, 0.35)`.

## Shapes
The system establishes a clean, calibrated roundedness standard (`Level 2 - Rounded`):
- **Base Components (Input fields, option boxes, action cards)**: `8px` (`0.5rem`) to `12px` (`0.75rem`) border-radius, projecting architectural discipline.
- **Large Content Cards & Canvas Containers**: `16px` (`1rem`) to `20px` (`1.25rem`) corner rounding with clipped internal content.
- **Pills, Badges & Chips**: Fully rounded pill geometry (`9999px`) used for status flags (`PRO`, `VIP`, `Novo`, `SM-2`), selected numerical filters (e.g. `[ 10 ]` questions), and navigational active indicators.

## Components

### Buttons
- **Primary CTA ("Começar Simulado")**: Full-width or auto-width action element featuring a horizontal micro-gradient from vibrant cobalt blue (`#2563EB`) to electric cyan (`#00B4D8`) or mint esmeralda (`#10B981` to `#00F5D4`). Text is pure white or dark navy bold (`#0B0F17`, weight 700) depending on background luminance. Includes a crisp hover state: translateY(-1px) with enhanced rim glow.
- **Secondary / Ghost Buttons**: Solid dark `#1E293B` surface with 1px hairline border `#334155`. On hover, border shifts to `#00B4D8` with text color transitioning to `#F8FAFC`.
- **Icon Action Buttons**: Symmetrical `40px x 40px` or `32px x 32px` squares with rounded-lg edges (`8px`), hosting crisp SVG line icons.

### Badges & Status Pills
- **Feature Tags (`Novo`, `Breve`, `VIP`, `PRO`, `SM-2`)**: Tiny pill format (`rounded-full`, padding `2px 8px`, `font-size: 10px`, `font-weight: 700`, uppercase).
  - *Novo*: Mint background tint `rgba(16, 185, 129, 0.15)` with text `#10B981`.
  - *PRO / VIP*: Warm amber gradient `rgba(245, 158, 11, 0.15)` with text `#FBBF24`.
  - *Breve / Inactive*: Subtle slate tint `rgba(100, 116, 139, 0.2)` with text `#94A3B8`.

### Segmented Option Pickers & Chips
- **Numerical & Timing Selectors (e.g., `5`, `10`, `15`, `20` / `sem tempo`, `1 min/questão`)**:
  - *Unselected*: Background `#161F30`, 1px border `#2D3748`, text `#94A3B8`.
  - *Selected*: Background `#2563EB` or `#00B4D8`, border `#38BDF8`, text `#FFFFFF`, complemented by an interior micro-shadow and subtle exterior cyan aura.
- **Subject Pills ("todas as matérias")**: Compact capsule (`rounded-full`), `#1E293B` background with subtle hover illumination.

### Sidebar Navigation Items
- Items display a 16px icon, followed by `body-md` label and optional trailing badge.
- Active item uses a solid cyan/blue gradient fill (`#2563EB` to `#00B4D8`) with white text and an expansive border-radius (`12px` or `rounded-full`). Inactive items sit transparently with `#94A3B8` text, transitioning smoothly to `#F8FAFC` on hover.

### Cards & Container Panels
- Base background `#161F30`, bordered by 1px solid `#243044`.
- Card headers incorporate an optional circular icon badge (e.g., emerald timer badge `40px x 40px` in `rgba(16, 185, 129, 0.15)` with `#10B981` icon) paired with crisp Jakarta Sans titles.
- Helper footers feature sub-text (`body-sm`) in `#64748B`.

### User Profile Status Bar
- Located in the bottom-left sidebar docking zone.
- Holds avatar circle, active presence indicator (emerald ring `#10B981` with pulse dot), role description (`CEO KiEstudos`, `Online`), and swift access toggles (`Modo Escuro`, `Sair`).