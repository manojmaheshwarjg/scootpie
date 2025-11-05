# Responsive Design Implementation

## Overview
Vesaki now features a fully responsive design that adapts to different screen sizes with distinct interfaces for mobile and desktop users.

## Breakpoints

### Mobile (< 1024px)
- **Navigation**: Floating bottom navigation bar with glassmorphism
- **Layout**: Full-width, mobile-first design
- **Cards**: Optimized for portrait viewing
- **Spacing**: Compact, touch-friendly

### Desktop (≥ 1024px - `lg` breakpoint)
- **Navigation**: Fixed left sidebar (288px / 18rem)
- **Layout**: Proper web application with sidebar + main content
- **Cards**: Centered content with max-width constraints
- **Spacing**: Generous padding and breathing room

## Desktop Features (lg:)

### Sidebar Navigation
```
Width: 288px (72 in Tailwind = w-72)
Position: Fixed left
Background: Dark gray (#111827 / gray-900)
Features:
- Logo with gradient icon at top
- Navigation items with full labels
- Active state with gradient background
- Premium upsell card at bottom
```

### Page Layouts
All pages use: `lg:pl-72` (padding-left: 18rem) to account for the sidebar

### Headers
- Desktop: Large headers with titles and descriptions in white cards
- Mobile: Compact headers with essential info

## Navigation Patterns

### Mobile
- Bottom floating pill with 5 icon buttons
- Gradient backgrounds for active states
- Glassmorphism effects

### Desktop
- Full sidebar with icon + label navigation
- Gradient backgrounds for active items
- Hover states on inactive items
- Premium upgrade section

## Page-Specific Responsive Behaviors

### Swipe Page
- **Mobile**: Compact header, full-width card stack
- **Desktop**: Professional header with stats, centered card stack (max-w-xl)

### Collections Page
- **Mobile**: Standard grid layout
- **Desktop**: Header in white card, wider grid layout

### Feed Page
- **Mobile**: 2 columns
- **Desktop**: Up to 5 columns, header in white card

### Chat Page
- **Mobile**: Standard chat interface
- **Desktop**: Larger header with gradient icon, more spacious layout

### Profile Page
- **Mobile**: Single column
- **Desktop**: Wide layout (max-w-6xl), cards in white with rounded corners

## Design System

### Colors
- **Gradient**: Yellow (#FBBF24) → Pink (#EC4899) → Purple (#9333EA)
- **Background**: Gray-50 to Gray-100
- **Sidebar**: Gray-900
- **Text**: White on dark, Gray-900 on light

### Shadows
- Mobile: Subtle shadows
- Desktop: Elevated with stronger shadows

### Border Radius
- Mobile: 2xl (1rem) and 3xl (1.5rem)
- Desktop: 2xl and 3xl for consistency

## Key CSS Classes Used

```css
/* Responsive Layout */
lg:pl-72          /* Desktop: Add left padding for sidebar */
lg:pb-0           /* Desktop: Remove bottom padding (no bottom nav) */
pb-16             /* Mobile: Bottom padding for bottom nav */

/* Visibility */
hidden lg:flex    /* Show only on desktop */
lg:hidden         /* Show only on mobile */

/* Sidebar Width */
w-72              /* Sidebar: 288px */
```

## Testing Responsive Design

1. **Mobile View**: Resize browser to < 1024px width
   - Should see bottom navigation
   - No sidebar visible
   - Compact layouts

2. **Desktop View**: Resize browser to ≥ 1024px width
   - Should see left sidebar
   - No bottom navigation
   - Spacious layouts with centered content

## Future Enhancements

- Tablet-specific layouts (768px - 1024px)
- Collapsible sidebar option
- Dark mode support
- More granular breakpoints for ultra-wide screens
