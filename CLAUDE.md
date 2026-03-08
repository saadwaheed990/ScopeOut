# Impulse Driving School Website

## Project Overview
Full-stack website for **Impulse Driving School** (impulsedrive.co.uk), Manchester's premier driving academy. Static frontend with an Express.js backend for bookings, payments, and contact handling.

## Tech Stack
### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Flexbox, Grid, animations
- **Vanilla JavaScript** - No frameworks or libraries
- **Fonts** - Google Fonts (Inter, Plus Jakarta Sans)
- **Icons** - Font Awesome 6.5.1 (CDN)

### Backend
- **Node.js / Express** - REST API server (`server/`)
- **SQLite** - Database (via better-sqlite3)
- **Stripe** - Payment processing
- **Nodemailer** - Email notifications

### Testing
- **Playwright** - UI and API tests (123 tests)

## Project Structure
```
/
├── index.html              # Homepage (hero, courses, instructors, testimonials, FAQ)
├── 404.html                # Custom 404 error page
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap for SEO
├── css/
│   ├── style.css           # Main stylesheet (all shared styles)
│   ├── booking.css         # Booking page styles (extracted from inline)
│   └── pricing.css         # Pricing page styles (extracted from inline)
├── js/
│   ├── main.js             # Main JS (preloader, nav, slider, counters, FAQ, AOS)
│   ├── booking.js          # Booking form multi-step logic and validation
│   ├── pricing.js          # Pricing manual/automatic tab toggle
│   ├── contact.js          # Contact form validation
│   ├── cookie-consent.js   # Cookie consent banner
│   └── whatsapp-widget.js  # WhatsApp floating chat widget
├── pages/
│   ├── about.html          # Company history, timeline, instructor profiles
│   ├── services.html       # Detailed course descriptions
│   ├── pricing.html        # Pricing tables with manual/auto toggle
│   ├── booking.html        # Multi-step booking form
│   ├── areas.html          # Coverage areas and test centres
│   ├── contact.html        # Contact form, map, hours
│   ├── privacy.html        # Privacy policy
│   └── terms.html          # Terms and conditions
├── server/
│   ├── index.js            # Express app entry point
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Environment variable template
│   ├── db/init.js          # SQLite database initialisation
│   ├── middleware/
│   │   ├── validation.js   # Input validation middleware
│   │   └── errorHandler.js # Global error handler
│   ├── routes/
│   │   ├── bookings.js     # POST /api/bookings
│   │   ├── contact.js      # POST /api/contact
│   │   ├── newsletter.js   # POST /api/newsletter
│   │   ├── payments.js     # Stripe payment intents
│   │   └── admin.js        # Admin dashboard endpoints
│   └── utils/
│       ├── email.js        # Email sending helpers
│       ├── reference.js    # Booking reference generator (IMP-XXXXX)
│       └── stripe.js       # Stripe client initialisation
├── tests/
│   ├── booking-flow.spec.js
│   ├── contact-form.spec.js
│   ├── cookie-consent.spec.js
│   ├── legal-pages.spec.js
│   ├── pricing.spec.js
│   ├── seo.spec.js
│   ├── whatsapp-widget.spec.js
│   └── api/
│       ├── bookings.api.spec.js
│       ├── contact.api.spec.js
│       ├── newsletter.api.spec.js
│       ├── payments.api.spec.js
│       └── admin.api.spec.js
└── images/                 # (placeholder directory)
```

## Key Architecture Decisions
- **Frontend** - Static files, no build system (no npm/webpack/gatsby for frontend)
- **Backend** - Express.js API in `server/` directory with its own `package.json`
- **CSS/JS extracted** - Booking, pricing, and contact page-specific styles/scripts are now in separate files (previously inline)
- **Cookie consent** and **WhatsApp widget** are standalone JS modules loaded on all pages
- Paths: root pages use `css/`, `js/`, `pages/` paths. Sub-pages use `../css/`, `../js/`, sibling `xxx.html`

## API Endpoints
- `POST /api/bookings` - Create a new booking
- `POST /api/contact` - Submit contact form
- `POST /api/newsletter` - Newsletter subscription
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `GET /api/admin/bookings` - List all bookings (admin)
- `GET /api/admin/stats` - Dashboard statistics (admin)

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
- Booking reference numbers generated server-side via `server/utils/reference.js` (IMP-XXXXX format), with client-side fallback
- Run tests with `npx playwright test` from project root
- Run backend with `node server/index.js` (requires `cd server && npm install` first)
- Copy `server/.env.example` to `server/.env` and fill in Stripe/email credentials

## Git
- **Branch**: `claude/rebuild-impulsedrive-website-RHSco`
- **Remote**: origin -> github.com/saadwaheed990/ScopeOut
