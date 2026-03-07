# Impulse Driving School Website

## Project Overview
Static website for **Impulse Driving School** (impulsedrive.co.uk), Manchester's premier driving academy. No build step required - pure HTML/CSS/JS.

## Tech Stack
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Flexbox, Grid, animations
- **Vanilla JavaScript** - No frameworks or libraries
- **Fonts** - Google Fonts (Inter, Plus Jakarta Sans)
- **Icons** - Font Awesome 6.5.1 (CDN)

## Project Structure
```
/
├── index.html              # Homepage (hero, courses, instructors, testimonials, FAQ)
├── css/style.css           # Main stylesheet (all shared styles)
├── js/main.js              # Main JS (preloader, nav, slider, counters, FAQ, AOS)
├── pages/
│   ├── about.html          # Company history, timeline, instructor profiles
│   ├── services.html       # Detailed course descriptions
│   ├── pricing.html        # Pricing tables with manual/auto toggle (has inline styles + JS)
│   ├── booking.html        # Multi-step booking form (has inline styles + JS)
│   ├── areas.html          # Coverage areas and test centres
│   └── contact.html        # Contact form, map, hours (has inline JS)
└── images/                 # (placeholder directory)
```

## Key Architecture Decisions
- **No build system** - Static files served directly, no npm/webpack/gatsby
- **Booking page** has self-contained inline CSS and JS (not in shared files) due to complex form-specific styles
- **Pricing page** has inline JS for manual/automatic tab toggle
- **Contact page** has inline JS for form validation
- Paths: root pages use `css/`, `js/`, `pages/` paths. Sub-pages use `../css/`, `../js/`, sibling `xxx.html`

## Business Information
- **Company**: Impulse Driving School, Manchester, est. 2017
- **Phone**: 07368 543 368 / 0161 492 0547 / 01617 927171
- **Email**: info@impulsedrive.co.uk
- **Address**: Spaces, Oxford St, Manchester, M1 5AN
- **Key stats**: 93% pass rate, 5000+ students, 12+ instructors, 20000+ training hours
- **Hours**: Mon-Fri 9AM-9PM, Sat-Sun 9AM-6PM

## Development Notes
- CSS uses custom properties defined in `:root` (style.css lines 7-60)
- Preloader uses `.loaded` class to hide (CSS transition on opacity/visibility)
- Testimonials slider is custom vanilla JS in main.js
- AOS (Animate On Scroll) is custom implementation using IntersectionObserver
- FAQ uses maxHeight animation for smooth open/close
- Booking form generates reference numbers client-side (IMP-XXXXX format)
- No server-side processing - booking form shows confirmation modal only

## Git
- **Branch**: `claude/rebuild-impulsedrive-website-RHSco`
- **Remote**: origin -> github.com/saadwaheed990/ScopeOut
