# Design Guidelines: ElectraPro - Dark Professional Electrical Services Platform

## Design Philosophy

**Dark-First Professional Theme** - ElectraPro uses a sophisticated dark theme that reflects the electrical industry while maintaining exceptional readability and visual hierarchy. No white backgrounds.

**Core Principles:**
- Deep dark backgrounds with vibrant electric blue accents
- High-contrast text for maximum readability
- Safety yellow/orange accents for CTAs and warnings
- Professional credibility through clean, modern design
- Mobile-first PWA-optimized experience

---

## Color System

### Dark Base Colors
- **Background**: Deep blue-gray (#0D1117 equivalent - 220 25% 7%)
- **Card/Elevated**: Slightly lighter dark (#16191F - 220 20% 11%)
- **Sidebar**: Rich dark blue-gray (#12141A - 220 25% 9%)
- **Borders**: Subtle gray borders (#2D3139 - 220 15% 18%)

### Brand Colors
- **Primary (Electric Blue)**: #3B9EFF (207 95% 62%) - Main actions, links, highlights
- **Accent (Safety Yellow)**: #FFC107 (40 98% 55%) - CTAs, warnings, important actions
- **Destructive (Warning Red)**: #FF5252 (0 75% 58%) - Errors, deletions

### Text Colors
- **Primary Text**: #F0F2F5 (210 15% 95%) - Main content, high readability
- **Secondary Text**: #8B9299 (220 8% 58%) - Less important info
- **Muted Text**: #5A5E66 for labels

---

## Typography

**Font Family:** Inter (Sans-serif)
- **Headings**: font-bold (700)
- **Subheadings**: font-semibold (600)
- **Body**: font-normal (400)
- **Buttons/UI**: font-medium (500)

**Type Scale:**
```
Hero: text-6xl (96px)
H1: text-4xl (36px)
H2: text-3xl (30px)
H3: text-2xl (24px)
H4: text-xl (20px)
Body: text-base (16px)
Small: text-sm (14px)
Tiny: text-xs (12px)
```

**Line Height:**
- Headings: leading-tight
- Body: leading-relaxed
- UI elements: leading-normal

---

## Layout & Spacing

### Container Widths
- **Full Width**: Dashboard layouts
- **Max 7xl**: Main content areas (1280px)
- **Max 4xl**: Forms and focused content (896px)
- **Max 2xl**: Modals and dialogs (672px)

### Spacing Scale (Tailwind)
```
Component padding: p-6 (24px)
Section spacing: py-12 to py-16
Card gaps: gap-6
Form spacing: space-y-4
Button padding: px-6 py-3
```

---

## Component Patterns

### Buttons
**Primary (Electric Blue)**
```tsx
<Button variant="default" className="bg-primary">
  Action
</Button>
```

**Accent (Safety Yellow)**
```tsx
<Button variant="default" className="bg-accent text-black">
  Important CTA
</Button>
```

**Ghost/Subtle**
```tsx
<Button variant="ghost">
  Secondary Action
</Button>
```

### Cards
**Dark Elevated Surface**
- Background: var(--card)
- Border: Subtle border-border
- Padding: p-6
- Rounded: rounded-lg
- Hover: hover-elevate class

```tsx
<Card className="bg-card border-border p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Forms
**Dark Input Style**
- Background: Dark input background (#2D3139)
- Border: Subtle border
- Focus: Electric blue ring
- Text: High-contrast white text
- Labels: Secondary text color

```tsx
<div className="space-y-4">
  <Label className="text-foreground">Field Name</Label>
  <Input 
    className="bg-input text-foreground border-border focus:ring-primary"
    placeholder="Enter value..."
  />
</div>
```

### Navigation
**Dark Sidebar**
- Background: var(--sidebar)
- Active item: bg-sidebar-accent with left accent border
- Icons: Lucide React icons
- Hover: hover-elevate effect

**Header**
- Height: h-14 (56px)
- Background: bg-background
- Border bottom: border-b

---

## Icons & Visual Elements

### Icon Library
**Primary**: Lucide React icons
```tsx
import { Zap, Calendar, Users, Settings } from "lucide-react";
```

**Electrical Theme Icons**
- Zap/Bolt: Power, electrical work
- Battery: Energy, charging stations
- Shield: Safety, compliance
- Wrench: Maintenance, repairs
- Building: Commercial work
- Home: Residential services

### Badges & Status
```tsx
<Badge variant="default" className="bg-primary">
  Active
</Badge>
<Badge variant="secondary" className="bg-accent text-black">
  Warning
</Badge>
<Badge variant="outline">
  Pending
</Badge>
```

---

## Responsive Design

### Breakpoints
```
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

### Mobile-First Patterns
- Sidebar collapses to top bar
- 1-column layouts on mobile
- Touch-friendly tap targets (min 44px)
- Bottom navigation for key actions
- Simplified forms with step indicators

### Grid Patterns
```tsx
// Service cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Dashboard metrics
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Tables
<div className="overflow-x-auto">
```

---

## Dark Mode Best Practices

### Contrast Requirements
- **AAA Standard**: 7:1 for body text
- **AA Standard**: 4.5:1 minimum for all text
- **Large Text**: 3:1 minimum for headings

### Readability Rules
1. Never use pure white (#FFF) - use #F0F2F5 instead
2. Never use pure black (#000) - use #0D1117 instead
3. Ensure borders are visible but subtle
4. Use shadows sparingly (dark backgrounds need lighter shadows)
5. Test all text colors against their backgrounds

### Visual Hierarchy
```
Primary info: text-foreground (95% lightness)
Secondary info: text-muted-foreground (58% lightness)
Disabled: text-muted-foreground with 50% opacity
```

---

## Interactive States

### Hover Effects
```tsx
// Subtle elevation
className="hover-elevate"

// Button hover (automatic via Button component)
// Card hover
className="hover:shadow-lg transition-shadow"
```

### Focus States
- Electric blue focus ring
- 2px ring width
- Offset for visibility

### Loading States
```tsx
import { Loader2 } from "lucide-react";

<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

---

## Accessibility (WCAG AA)

### Requirements
- ✅ Keyboard navigation throughout
- ✅ Focus indicators on all interactive elements
- ✅ ARIA labels for icons and complex widgets
- ✅ Alt text for all images
- ✅ Color contrast minimum 4.5:1
- ✅ Error messages announced to screen readers
- ✅ Semantic HTML structure

### Dark Mode Accessibility
- Test with screen readers in dark mode
- Ensure sufficient contrast for colorblind users
- Provide visual indicators beyond color alone
- Test with Windows High Contrast mode

---

## Animation Guidelines

### Allowed Animations
```
Button hover: scale(1.02) + shadow
Card hover: shadow-lg
Modal: fade + scale(0.95 → 1)
Loading: spin
Toast: slide + fade
```

### Duration & Easing
```
Fast: 150ms (hover, focus)
Normal: 300ms (cards, modals)
Slow: 500ms (page transitions)
Easing: ease-in-out
```

### Performance
- Use `transform` and `opacity` only
- Avoid animating `width`, `height`, `margin`
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

---

## Social Sharing Integration

### Share Buttons
```tsx
// Dark themed social buttons
<div className="flex gap-3">
  <Button variant="outline" size="sm" className="bg-[#1877F2]">
    <Facebook /> Share
  </Button>
  <Button variant="outline" size="sm" className="bg-[#1DA1F2]">
    <Twitter /> Tweet
  </Button>
  <Button variant="outline" size="sm" className="bg-[#0A66C2]">
    <LinkedIn /> Share
  </Button>
</div>
```

### Referral System
- Unique referral codes per client
- Dark-themed referral cards
- Copy-to-clipboard functionality
- QR codes for mobile sharing

---

## Role-Specific UI Patterns

### Client Portal
- Simplified dark navigation
- Large CTAs with accent colors
- Service request wizard
- Payment history with status badges
- Educational tooltips and guides

### Employee Portal
- Job cards with status colors
- Quick actions toolbar
- AI Sales Agent integration
- Email automation dashboard
- Contact management CRM

### Admin Dashboard
- Comprehensive metrics with charts
- User management tables
- System settings panels
- Analytics with data visualizations
- Multi-agent AI monitoring

---

## Brand Voice & Messaging

### Company Slogans
1. "We make power easy"
2. "Lighting your life in any situation"
3. "We are building a business that will build business"

### Tone
- Professional yet approachable
- Educational without being condescending
- Safety-conscious and regulation-aware
- Customer-success focused

---

## PWA Specific Guidelines

### Mobile App Experience
- Native-like dark theme
- Splash screens with brand colors
- App icons (512x512, 192x192)
- Offline-first architecture
- Bottom navigation for main actions

### Install Prompts
- Custom install UI (dark themed)
- Clear value proposition
- Dismiss and remind later options

---

This design system ensures ElectraPro maintains a consistent, professional dark theme that enhances usability, reflects the electrical industry, and provides an exceptional user experience across all devices and user roles.
