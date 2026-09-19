# RIVET Design Guide

Visual identity, UI/UX guidelines, and design system for RIVET.

---

## 🎨 Design Philosophy

**Professional. Terminal-inspired. No AI clichés.**

RIVET's design reflects our core values:
- **Honesty** - No flashy marketing, clear communication
- **Efficiency** - Information-dense, fast to parse
- **Professionalism** - Serious tool for serious developers
- **Clarity** - Every element serves a purpose

---

## ❌ What We Avoid (AI Clichés)

### The "AI Tool" Aesthetic (DON'T)
- ❌ Purple gradients (every AI tool uses purple)
- ❌ Sparkle/star/magic icons ✨
- ❌ Glowing effects everywhere
- ❌ Rounded bubbly fonts
- ❌ Generic "assistant" vibes
- ❌ Overly colorful dashboards
- ❌ Cute robot mascots
- ❌ "Powered by AI" badges everywhere

**Why?** We want to be taken seriously as a professional code quality tool, not another AI chatbot.

---

## ✅ What We Embrace

### Inspiration
- **Linear** - Clean, fast, keyboard-first
- **Vercel** - Minimalist, professional
- **Stripe** - Information-dense, clear hierarchy
- **GitHub CLI** - Terminal aesthetics
- **Railway** - Dark mode excellence

---

## 🎨 Color Palette

Actual tokens are defined in `apps/web/src/app/globals.css` and use the OKLCH color space, not hex.

### Surfaces & accent
```css
--bg-canvas: oklch(0.12 0.008 60);
--bg-primary: oklch(0.145 0.01 60);
--bg-secondary: oklch(0.18 0.012 60);
--bg-tertiary: oklch(0.22 0.014 60);
--bg-elevated: oklch(0.2 0.012 60);

--accent: oklch(0.78 0.15 70);         /* forge amber */
--accent-hover: oklch(0.84 0.14 75);
--accent-pressed: oklch(0.68 0.14 65);
--accent-muted: oklch(0.78 0.15 70 / 0.12);
--accent-subtle: oklch(0.78 0.15 70 / 0.06);
```

### Text
```css
--text-primary: oklch(0.96 0.01 80);
--text-secondary: oklch(0.72 0.015 70);
--text-muted: oklch(0.55 0.012 65);
--text-inverse: oklch(0.14 0.01 60);
```

### Semantic (severity) colors
```css
--critical: oklch(0.63 0.22 25);
--high: oklch(0.7 0.17 45);
--medium: oklch(0.8 0.14 85);
--low: oklch(0.7 0.1 230);
--info: oklch(0.6 0.02 60);
--success: oklch(0.72 0.15 155);
```
Each has a matching `-bg` variant at 12% alpha.

### Category accents
One accent per engine, restrained, no purple:
```css
--cat-security, --cat-bugs, --cat-performance, --cat-smells,
--cat-architecture, --cat-practices, --cat-dependencies, --cat-flows
```

### Borders
```css
--border-subtle: oklch(1 0 0 / 0.06);
--border-default: oklch(1 0 0 / 0.1);
--border-emphasis: oklch(1 0 0 / 0.16);
--border-accent: oklch(0.78 0.15 70 / 0.4);
```

---

## 🔤 Typography

### Fonts

**Code (Monospace):** `JetBrains Mono` (Google Font, via `next/font/google` in `layout.tsx`).
- Use for: Code snippets, file paths, commands, data

**UI (Sans-serif):** `IBM Plex Sans` (Google Font, not Inter).
- Use for: Headings, body text, buttons, labels

### Type Scale
Actual values from `globals.css` (not a round 16px base):
```css
--text-xs: 0.75rem;
--text-sm: 0.8125rem;
--text-base: 0.9375rem;
--text-lg: 1.0625rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: clamp(1.75rem, 3vw, 2.25rem);
--text-4xl: clamp(2.25rem, 5vw, 3.5rem);
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 📐 Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

**Consistent spacing:**
- 4px grid system
- Use multiples of 4px
- No random spacing values

---

## 🔲 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px - very subtle */
--radius-md: 0.25rem;     /* 4px - default */
--radius-lg: 0.5rem;      /* 8px - cards */
--radius-full: 9999px;    /* Pills/badges */
```

**Philosophy:** Sharp or slightly rounded. Never bubbly.

---

## 💻 CLI Design

### Terminal Output Style

```bash
# Good: Clean, informative, scannable
╭─ Tech Debt Score ────────────────────╮
│                                       │
│            72/100  ⚠                  │
│                                       │
│    ▁▂▃▄▅▆▇█ (improving)              │
╰───────────────────────────────────────╯

╭─ Critical Issues ─────────────────────╮
│ ⚠ SQL Injection in auth.ts:42        │
│ ⚠ Exposed API key in config.ts:12    │
│ ⚠ react 17.0.2 has 2 CVEs            │
╰───────────────────────────────────────╯

✓ Fixed 12 issues automatically
● 8 require manual review
→ View report: rivet.dev/scan/abc123
```

### Color Usage in Terminal
```typescript
import chalk from 'chalk'

// Severity colors
const critical = chalk.red.bold('⚠')
const high = chalk.red('⚠')
const medium = chalk.yellow('○')
const low = chalk.gray('○')
const success = chalk.green('✓')

// Category colors (chalk has no built-in "amber"; use chalk.hex() for the forge accent)
const security = chalk.red
const performance = chalk.hex('#f59e0b')
const smell = chalk.yellow
const info = chalk.gray
```

### Symbols
- ✓ Success
- ✗ Error
- ⚠ Warning/Critical
- ○ Medium/Low
- → Action needed
- ● Information
- ◆ Category marker
- ├─ Tree structure
- └─ Last item

### Box Drawing
```
╭─ Title ───────╮
│ Content       │
├───────────────┤
│ More content  │
╰───────────────╯
```

---

## 🖥️ Web Dashboard Design

### Layout Principles

1. **Information Density**
   - Developers want data, not whitespace
   - Show more, scroll less
   - Compact but not cramped

2. **Hierarchy**
   - Clear visual hierarchy
   - Most important info first
   - Progressive disclosure

3. **Performance**
   - Instant feedback
   - Skeleton loaders
   - Optimistic updates

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ RIVET                    [Project ▼]    [Scan] [Report] │ ← Header
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ╭─ Tech Debt Score ─╮  ╭─ Issues By Category ────────╮│
│  │                    │  │  Security      8 ⚠         ││
│  │      72/100        │  │  Bugs          3 ⚠         ││
│  │       ⚠            │  │  Performance   12 ○        ││
│  │                    │  │  Code Smells   24 ○        ││
│  │  ▁▂▃▄▅▆▇█         │  │  Dependencies  15 ⚠         ││
│  ╰────────────────────╯  ╰────────────────────────────╯│
│                                                          │
│  ╭─ Critical Issues ──────────────────────────────────╮ │
│  │  ⚠ SQL Injection in auth.ts:42                    │ │
│  │  ⚠ Exposed API key in config.ts:12                │ │
│  │  ⚠ react 17.0.2 has 2 CVEs                        │ │
│  │  → View all 8 critical issues                     │ │
│  ╰────────────────────────────────────────────────────╯ │
│                                                          │
│  ╭─ Recent Scans ─────────────────────────────────────╮ │
│  │  Jan 1, 2026 10:23am  main branch    72/100  ⚠    │ │
│  │  Dec 31, 2025 4:45pm  feature/auth   68/100  ⚠    │ │
│  │  Dec 30, 2025 2:10pm  main branch    71/100  ⚠    │ │
│  ╰────────────────────────────────────────────────────╯ │
└─────────────────────────────────────────────────────────┘
```

### Component Design

#### Cards
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

/* Hover state - subtle */
.card:hover {
  border-color: var(--border-default);
}
```

#### Buttons
```css
/* Primary button */
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  font-weight: var(--font-semibold);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

/* Ghost button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
```

#### Badges
```css
.badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-critical {
  background: var(--error-bg);
  color: var(--error);
}
```

---

## 🎯 Icon System

No icon library is a dependency of `apps/web` today; the web app currently uses emoji and inline
SVG rather than an icon package.

### Icon Guidelines
- Line icons only (no filled)
- 24px default size
- 1.5px stroke width
- Consistent style across app
- Use semantic naming

### Common Icons
```
⚠  Warning/Alert
✓  Success/Check
✗  Error/X
○  Circle/Bullet
●  Filled Circle
→  Arrow Right
↗  External Link
⚙  Settings
📊 Charts/Analytics
🔒 Security
⚡ Performance
🔍 Search
📄 File
📁 Folder
```

---

## 📱 Responsive Design

### Breakpoints
```css
--screen-sm: 640px;   /* Mobile */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
```

### Mobile-First Approach
1. Design for mobile first
2. Enhance for larger screens
3. Touch-friendly targets (44px min)
4. No hover-only interactions

---

## ♿ Accessibility

### Requirements
1. **Color Contrast**
   - WCAG AA minimum (4.5:1 for text)
   - Test with contrast checker

2. **Keyboard Navigation**
   - All interactive elements tabbable
   - Visible focus indicators
   - Escape to close modals

3. **Screen Readers**
   - Semantic HTML
   - ARIA labels where needed
   - Alt text for images

4. **Motion**
   - Respect `prefers-reduced-motion`
   - Subtle animations only

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

---

## 🎬 Animation Guidelines

### Principles
1. **Purposeful** - Every animation serves a function
2. **Fast** - 150-300ms max
3. **Subtle** - Don't distract
4. **Skippable** - Respect motion preferences

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 🖼️ Data Visualization

### Chart Colors
```css
--chart-1: #f59e0b;  /* Amber - primary */
--chart-2: #10b981;  /* Green - success */
--chart-3: #3b82f6;  /* Blue - info */
--chart-4: #8b5cf6;  /* Purple - only acceptable use */
--chart-5: #ef4444;  /* Red - error */
```

### Chart Guidelines
1. Use `recharts` library
2. Dark background
3. Muted grid lines
4. Clear labels
5. Tooltips on hover

---

## 📐 Grid System

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(12, 1fr);
}

.col-span-6 {
  grid-column: span 6;
}
```

---

## 🎨 Brand Assets

### Logo
- Rivet icon: 🔩 (simple rivet symbol)
- Wordmark: "RIVET" in JetBrains Mono
- Color: Amber on dark or White on dark

### Logo Variations
```
RIVET      # Primary
🔩 RIVET   # With icon
rivet      # Lowercase (CLI contexts)
```

### Tagline
"Rivet your codebase"

### Usage
- On dark backgrounds: Amber or white
- On light backgrounds: Charcoal
- Minimum clear space: 16px all sides
- Minimum size: 100px width

---

## 🎯 Design Checklist

Before shipping any UI:

- [ ] Follows color palette
- [ ] Uses correct typography
- [ ] Consistent spacing (4px grid)
- [ ] Accessible (contrast, keyboard, screen reader)
- [ ] Responsive (mobile to desktop)
- [ ] Dark mode tested
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] No AI clichés (purple, sparkles, etc.)

---

## 🚫 Common Mistakes to Avoid

1. ❌ **Too much color** - Keep it professional
2. ❌ **Inconsistent spacing** - Use the spacing system
3. ❌ **Poor contrast** - Test accessibility
4. ❌ **Overly rounded corners** - Keep it sharp
5. ❌ **Flashy animations** - Subtle is better
6. ❌ **Generic AI aesthetics** - Be unique

---

## 🎓 Design Resources

`apps/web` has no UI component library, icon package, or charting library as a dependency today;
components are hand-built with plain React/CSS.

- **Examples**: Linear, Vercel, Stripe

---

**Design with purpose. Build with confidence.** 🔩
