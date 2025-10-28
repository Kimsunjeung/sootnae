# JTBC Marathon Runner Tracking - Design Guidelines

## Design Approach

**Reference-Based Approach**: Draw inspiration from premium sports tracking applications (Strava, Nike Run Club, race tracking platforms) combined with clean map-centric interfaces (Google Maps, Apple Maps). The design should balance athletic energy with functional clarity, optimized for mobile viewing during race day.

**Design Principles**:
- Mobile-first: Most users will access this while at the race venue
- Glanceable information: Critical data should be visible instantly
- Real-time focus: Design should communicate live, dynamic tracking
- Athletic professionalism: Reflects JTBC Marathon's premium event status
- Korean-optimized: All text and interactions designed for Korean users

---

## Core Design Elements

### Typography

**Korean Font Stack** (via Google Fonts CDN):
- Primary: 'Noto Sans KR' - clean, highly legible for Korean text
- Secondary: 'Roboto' or 'Inter' - for numbers/times (athletic feel)

**Hierarchy**:
- Page Title: 32px/Bold (mobile), 48px/Bold (desktop) - "JTBC 마라톤 러너 추적"
- Section Headers: 20px/Bold (mobile), 28px/Bold (desktop)
- Runner Name: 24px/SemiBold
- Checkpoint/Status: 18px/Medium
- Body Text: 16px/Regular
- Small Labels: 14px/Regular
- Timing Data: 20px/Mono (tabular numbers for times/distances)

### Layout System

**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, and 12 for consistent rhythm
- Component padding: p-4 (mobile), p-6 (desktop)
- Section spacing: space-y-6 (mobile), space-y-8 (desktop)
- Card gaps: gap-4
- Button padding: px-6 py-3

**Container Strategy**:
- Max-width: max-w-6xl for main content
- Map container: Full viewport height minus header (h-[calc(100vh-120px)])
- Mobile: Single column, full-width components
- Desktop: Sidebar (400px) + Map (flex-1) layout

---

## Page Structure

### Header Section
- JTBC Marathon logo/branding (left)
- Race information: "2025년 11월 2일 | Full 코스 (42.195km)" (center/right)
- Compact, sticky header (h-16 mobile, h-20 desktop)
- Clean separation from main content

### Bib Number Input Panel
**Location**: Top of page on mobile; fixed sidebar on desktop

**Components**:
- Large, clear input field for bib number entry
  - Input size: h-14 with text-2xl
  - Placeholder: "배번 입력 (예: 1234)"
  - Full-width button below: "러너 위치 확인"
- Recent searches: Chips showing last 3 searched bib numbers (quick access)
- Input validation feedback with clear error states

### Runner Information Card
**Display when bib number is entered**:

**Card Layout** (stacked sections with clear dividers):
1. **Runner Header**:
   - Runner name (large, bold)
   - Bib number badge
   - Category/Division (if available)

2. **Current Status Panel**:
   - Live indicator (pulsing dot + "실시간 추적중")
   - Current checkpoint name/location
   - Progress percentage bar (visual indicator)
   - Time elapsed since start (large, prominent)

3. **Split Times Grid** (2-column layout):
   - Checkpoint name | Time
   - Each checkpoint as a row
   - Highlight current checkpoint
   - Show pace/speed if available

4. **Quick Stats** (3-column grid):
   - Distance covered
   - Current pace
   - Est. finish time

### Map Container
**Interactive Course Map**:
- Full-height map display
- Course route highlighted as a colored path
- Checkpoint markers along the route
- Runner position: Custom animated marker (pulsing circle or runner icon)
- Start/Finish markers clearly distinguished
- Zoom controls (mobile: bottom-right)
- Current location button (to re-center on runner)

**Map Overlay Elements**:
- Legend: Course route, Checkpoints, Runner position
- Distance scale
- Auto-refresh timer indicator: "30초 후 자동 새로고침"

---

## Component Library

### Input Components
**Bib Number Input**:
- Large touch-friendly input (min-height: 56px)
- Number keyboard on mobile
- Clear/reset button inside input (right side)
- Autofocus on page load

**Search Button**:
- Primary CTA: Full-width on mobile, fixed-width on desktop
- Loading state: Spinner + "검색중..." text
- Success state: Checkmark animation

### Information Cards
**Runner Info Card**:
- Elevated surface (shadow-md)
- Rounded corners (rounded-lg)
- Internal spacing: p-6
- Dividers between sections (border-t with subtle styling)

**Checkpoint List Items**:
- Each checkpoint as a horizontal row
- Left: Checkpoint number/icon
- Center: Checkpoint name and distance
- Right: Time (if passed) or "예정" status
- Active checkpoint: Highlighted background, bold text

### Status Indicators
**Live Tracking Badge**:
- Small pulsing animation
- "LIVE" or "실시간" label
- Position: Top-right of runner card

**Progress Bar**:
- Full-width horizontal bar
- Filled portion shows completion percentage
- Segments for each checkpoint (optional)
- Height: h-2, rounded-full

**Auto-refresh Timer**:
- Circular progress indicator or countdown text
- Position: Bottom of sidebar or top of map
- Clear "새로고침" manual button nearby

### Map Elements
**Runner Marker**:
- Custom SVG marker (runner icon or pulsing dot)
- Size: 40x40px minimum for touch targets
- Animated: Gentle pulse or bounce to draw attention
- Info popup on click: Condensed runner stats

**Checkpoint Markers**:
- Numbered markers (1, 2, 3...) or flag icons
- Size: 32x32px
- Distinct from runner marker
- Tooltip on hover: Checkpoint name + distance

**Course Path**:
- Stroke width: 4-6px
- Dashed or gradient showing direction
- Slightly transparent to show map underneath

---

## Interactions & Animations

**Page Load**:
- Fade-in animation for initial content (200ms)
- Input field subtle focus animation

**Search/Track Action**:
- Button ripple effect on click
- Loading spinner during data fetch (300ms minimum)
- Success: Card slides in from right (mobile) or fades in (desktop)
- Map animates to runner position with smooth zoom/pan

**Auto-refresh**:
- Subtle flash or highlight when data updates
- Runner marker smooth transition to new position (1s animation)
- No jarring page reloads

**Map Interactions**:
- Smooth zoom/pan with momentum
- Marker click: Info popup slides up from bottom (mobile) or appears as tooltip (desktop)

---

## Responsive Behavior

**Mobile (< 768px)**:
- Single column layout
- Bib input at top
- Runner info card below input
- Map section follows (60vh minimum height)
- Sticky header
- Bottom sheet pattern for detailed checkpoint info

**Desktop (≥ 768px)**:
- Split layout: Sidebar (400px) + Map (remaining width)
- Sidebar: Fixed position, scrollable if content overflows
- Map: Full height from below header
- Input and runner info in sidebar
- Side-by-side viewing of data and map

---

## Images

**Hero/Header Background** (optional):
- Marathon start line or race course photo
- Subtle overlay to ensure text readability
- Height: 200px (mobile), 300px (desktop)
- Positioned behind header text if used

**Empty State Illustration**:
- When no bib number entered: Simple illustration or icon showing a runner
- Descriptive text: "배번을 입력하여 러너의 위치를 확인하세요"
- Centered in main content area

**No Images Required**:
- Focus is on functional map and data display
- Athletic/marathon feel achieved through typography and spacing
- Map itself provides visual richness

---

## Accessibility & Usability

- High contrast for text on all backgrounds
- Touch targets minimum 44x44px
- Korean screen reader optimization
- Keyboard navigation for input field
- Error messages in clear, polite Korean
- Loading states for all async operations
- Offline state: Clear message if connection lost during tracking