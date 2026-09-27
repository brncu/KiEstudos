# KiEstudos Login Page - Design System & Specification

This document outlines the visual architecture and implementation details for the KiEstudos Auth/Login Page (`src/routes/auth.tsx`). Use this as a reference when designing new features or extending the authentication flow.

## 1. Global Aesthetic
The login page follows a **Split-Screen Layout** with a dark, premium aesthetic tailored for high-end educational platforms.
- **Background Color:** Deep Slate Navy (`#020617`)
- **Theme:** Glassmorphism with subtle neon glows (Emerald and Blue).
- **Core Font:** Sans-serif (Inter/Geist) with heavy emphasis on typography contrast (extrabold titles, muted subtitles).

## 2. Layout Structure

### Left Column (Auth Form)
- **Width:** Max width of `440px` centered within a `flex-1` container.
- **Logo:** The KiEstudos uploaded logo (`logo-kiestudos.jpg`) rendered at `h-24` with `mix-blend-lighten` to blend seamlessly into the dark background.
- **Typography:** 
  - Main Title: `4xl`/`5xl` extrabold, using a white-to-slate text gradient.
  - Subtitle: `slate-400` medium text.
- **Inputs:**
  - Wrapper: `bg-white/[0.03]` with `backdrop-blur-md`.
  - Border: `border-white/10`, which transitions to `border-emerald-400/60` on focus.
  - Icons: Integrated `lucide-react` icons (Mail, Lock) inside the inputs.
- **Custom Elements:**
  - Checkbox: Custom HTML/CSS checkbox utilizing `lucide-react`'s `<Check />` icon for a premium checkmark animation.
  - Button: Deep Emerald gradient (`from-emerald-500 to-emerald-400`) with a glowing hover effect and an `<ArrowRight />` that slides right on hover.

### Right Column (Hero & Feature Showcase)
- **Visibility:** Hidden on mobile (`hidden lg:block`).
- **Main Image:** Abstract study/library background image that slowly zooms in on hover (`hover:scale-110 duration-[10s]`).
- **Overlays:** 
  - `bg-gradient-to-tr from-[#020617] via-[#020617]/70 to-transparent` to blend the image into the dark theme.
  - A subtle `emerald-900/20` mix-blend overlay.
- **Floating Feature Cards:**
  - Two `backdrop-blur-2xl` glass cards sitting over the image.
  - Highlight key platform features: "Métrica Precisa" and "Revisão Ativa (IA)".
  - Hover effects: Cards tilt and elevate slightly (`hover:-translate-y-2`), glowing in their respective colors (Emerald and Blue).

## 3. Interactive Logic & Animations

- **State Modes:** The form handles two modes: `"signin"` (default login) and `"forgot"` (password recovery).
- **View Transitions API:** When a user successfully logs in, the screen uses `document.startViewTransition()` to perform a buttery-smooth crossfade into the Dashboard (bypassing harsh page reloads).
- **Staggered Animations:** Elements on the page use a custom `@keyframes fade-slide-up` paired with `.delay-100`, `.delay-200`, etc., creating a cascading entrance animation when the page loads.

## 4. Dependencies
- `@tanstack/react-router` for navigation.
- `lucide-react` for iconography.
- `supabase-js` for Auth logic (`signInWithPassword`, `resetPasswordForEmail`).
- Tailwind CSS for all styling and arbitrary CSS values.
