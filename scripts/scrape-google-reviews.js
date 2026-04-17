#!/usr/bin/env node
/**
 * Scrape every review for the Impulse Driving School Google Maps listing and
 * write them to data/google-reviews.csv.
 *
 * Usage:  node scripts/scrape-google-reviews.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const MAPS_URL = 'https://www.google.com/maps/place/Impulse+Driving+School+-+Manchester/@53.4771161,-2.2437587,17z/data=!3m1!5s0x487737f146095631:0xf57cc72e3891b5b0!4m8!3m7!1s0x487bb19bbafe4731:0xc4180dd719a64f29!8m2!3d53.4771161!4d-2.2437587!9m1!1b1!16s%2Fg%2F11j7j7hdcx?hl=en';

const OUTPUT_CSV = path.join(__dirname, '..', 'data', 'google-reviews.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'data', 'google-reviews.json');
const EXPECTED_REVIEWS = 469;

// --- Known reference lists used to pull structured fields out of free text ---
const KNOWN_INSTRUCTORS = [
  'Ali', 'Asim', 'Asif', 'Bilal', 'Danny', 'Dave', 'David', 'Faisal', 'Fahad',
  'Hamza', 'Haroon', 'Hassan', 'Ibrahim', 'Imran', 'Iqbal', 'Irfan', 'Jamal',
  'Junaid', 'Kamran', 'Kashif', 'Khalid', 'Mike', 'Mohammed', 'Mohammad',
  'Mo', 'Naveed', 'Nadeem', 'Nasir', 'Omar', 'Raj', 'Raza', 'Rehan', 'Riaz',
  'Saad', 'Sajid', 'Salman', 'Sam', 'Shahid', 'Shan', 'Sohail', 'Tahir',
  'Tariq', 'Tony', 'Umar', 'Usman', 'Waheed', 'Waqar', 'Wasim', 'Yasir',
  'Zain', 'Zaki', 'Zeeshan'
];

const KNOWN_TEST_CENTRES = [
  'Atherton', 'Bolton', 'Bredbury', 'Bury', 'Cheetham Hill', 'Chadderton',
  'Failsworth', 'Heaton Moor', 'Hyde', 'Kingsway', 'Manchester',
  'Middleton', 'Openshaw', 'Rochdale', 'Sale', 'Salford', 'Stockport',
  'West Didsbury', 'Wigan'
];

const COURSE_KEYWORDS = [
  { pattern: /\bintensive\b/i, label: 'Intensive Course' },
  { pattern: /\bsemi[-\s]?intensive\b/i, label: 'Semi-Intensive Course' },
  { pattern: /\brefresher\b/i, label: 'Refresher Course' },
  { pattern: /\bpass\s*plus\b/i, label: 'Pass Plus' },
  { pattern: /\bmotorway\b/i, label: 'Motorway Lessons' },
  { pattern: /\bautomatic\b/i, label: 'Automatic Lessons' },
  { pattern: /\bmanual\b/i, label: 'Manual Lessons' },
  { pattern: /\bbeginner/i, label: 'Beginner Lessons' },
  { pattern: /\b(first\s+time|1st\s+time)\b/i, label: 'Beginner Lessons' },
  { pattern: /\bblock\s+booking\b/i, label: 'Block Booking' },
  { pattern: /\btheory\b/i, label: 'Theory Test Prep' }
];

// -------------------------------------------------------------------------

function extractInstructor(text) {
  if (!text) return '';
  const patterns = [
    /(?:instructor|teacher|tutor|trainer)\s+(?:was\s+|is\s+|named\s+|called\s+)?([A-Z][a-zA-Z]+)/,
    /\b(?:with|by|from|thanks?\s+to|thank\s+you\s+to)\s+([A-Z][a-zA-Z]+)\b/,
    /\b([A-Z][a-zA-Z]+)\s+(?:was|is)\s+(?:an?\s+)?(?:amazing|excellent|great|wonderful|fantastic|brilliant|patient|helpful|best|good)/,
    /\b([A-Z][a-zA-Z]+)\s+(?:helped|taught|trained|coached)/
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && KNOWN_INSTRUCTORS.some((n) => n.toLowerCase() === m[1].toLowerCase())) {
      return properCase(m[1]);
    }
  }

  for (const name of KNOWN_INSTRUCTORS) {
    const re = new RegExp(`\\b${name}\\b`, 'i');
    if (re.test(text)) return name;
  }
  return '';
}

function extractTestCentre(text) {
  if (!text) return '';
  const testCentrePattern = /\b([A-Z][a-zA-Z\s]+?)\s+test\s+cent(?:re|er)\b/i;
  const m = text.match(testCentrePattern);
  if (m) {
    const candidate = m[1].trim();
    const hit = KNOWN_TEST_CENTRES.find((c) => c.toLowerCase() === candidate.toLowerCase());
    if (hit) return hit;
  }
  for (const c of KNOWN_TEST_CENTRES) {
    const re = new RegExp(`\\b${c}\\b`, 'i');
    if (re.test(text)) return c;
  }
  return '';
}

function extractCourse(text) {
  if (!text) return '';
  for (const c of COURSE_KEYWORDS) {
    if (c.pattern.test(text)) return c.label;
  }
  return '';
}

function properCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (/[",]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function toCsv(rows) {
  const header = ['name', 'course', 'instructor', 'test_centre', 'rating', 'date', 'review', 'image_url'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      csvEscape(r.name),
      csvEscape(r.course),
      csvEscape(r.instructor),
      csvEscape(r.test_centre),
      csvEscape(r.rating),
      csvEscape(r.date),
      csvEscape(r.review),
      csvEscape(r.image_url)
    ].join(','));
  }
  return lines.join('\n') + '\n';
}

async function acceptConsent(page) {
  const buttonSelectors = [
    'button[aria-label*="Accept all" i]',
    'button[aria-label*="Accept" i]',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'form[action*="consent"] button'
  ];
  for (const sel of buttonSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click({ timeout: 3000 }).catch(() => {});
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        return;
      }
    } catch (_) {}
  }
}

async function findReviewsScroller(page) {
  return await page.evaluateHandle(() => {
    const candidates = Array.from(document.querySelectorAll('[aria-label], div'));
    for (const el of candidates) {
      const label = el.getAttribute && el.getAttribute('aria-label');
      if (label && /reviews of /i.test(label)) return el;
    }
    const feeds = document.querySelectorAll('div.m6QErb[aria-label], div.m6QErb.DxyBCb');
    for (const el of feeds) if (el.scrollHeight > el.clientHeight) return el;
    return null;
  });
}

async function scrollAllReviews(page, expected) {
  console.log('[scrape] Waiting for reviews feed to load...');
  await page.waitForTimeout(2500);

  let scrollerHandle = await findReviewsScroller(page);
  if (!scrollerHandle || !(await scrollerHandle.asElement())) {
    console.warn('[scrape] Could not find a reviews scroll container. Trying fallback.');
    scrollerHandle = await page.evaluateHandle(() => document.querySelector('div[role="main"]'));
  }

  let lastCount = 0;
  let stagnantRounds = 0;

  for (let i = 0; i < 600; i++) {
    const count = await page.evaluate(() => document.querySelectorAll('div[data-review-id]').length);
    process.stdout.write(`\r[scrape] Loaded reviews: ${count}${expected ? ' / ' + expected : ''}   `);

    if (expected && count >= expected) break;
    if (count === lastCount) {
      stagnantRounds++;
      if (stagnantRounds >= 8) break;
    } else {
      stagnantRounds = 0;
      lastCount = count;
    }

    await page.evaluate((el) => {
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, scrollerHandle);
    await page.waitForTimeout(900);
  }
  console.log('');
}

async function expandAllMoreButtons(page) {
  console.log('[scrape] Expanding truncated reviews...');
  let clicked = 1;
  while (clicked > 0) {
    clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
        .filter((b) => /^more$/i.test(b.textContent.trim()) && b.offsetParent !== null);
      buttons.forEach((b) => b.click());
      return buttons.length;
    });
    if (clicked > 0) await page.waitForTimeout(400);
  }
}

async function extractReviews(page) {
  return await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div[data-review-id]'));
    return cards.map((card) => {
      const nameEl = card.querySelector('.d4r55, .WNxzHc, div[class*="fontTitleMedium"] > button, button[jsaction*="pane.review"]');
      const name = nameEl ? nameEl.innerText.trim().split('\n')[0] : '';

      let image_url = '';
      const img = card.querySelector('img.NBa7we, button img, img');
      if (img) image_url = img.getAttribute('src') || '';

      const textEl = card.querySelector('.wiI7pd, span[jsname], .MyEned');
      let review = textEl ? textEl.innerText.trim() : '';
      if (!review) {
        const spans = card.querySelectorAll('span');
        for (const s of spans) {
          const t = s.innerText.trim();
          if (t.length > 20) { review = t; break; }
        }
      }

      const ratingEl = card.querySelector('span[role="img"][aria-label*="star" i], span.kvMYJc');
      let rating = '';
      if (ratingEl) {
        const label = ratingEl.getAttribute('aria-label') || '';
        const m = label.match(/([\d.]+)\s*star/i);
        if (m) rating = m[1];
      }

      let date = '';
      const dateEl = card.querySelector('.rsqaWe, .xRkPPb, span.DU9Pgb span');
      if (dateEl) date = dateEl.innerText.trim();

      return { name, image_url, review, rating, date };
    });
  });
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT_CSV), { recursive: true });

  const browser = await chromium.launch({
    headless: process.env.HEADFUL === '1' ? false : true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    locale: 'en-GB',
    viewport: { width: 1366, height: 900 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  console.log('[scrape] Loading Google Maps listing...');
  await page.goto(MAPS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await acceptConsent(page);

  try {
    await page.waitForSelector('div[data-review-id]', { timeout: 30000 });
  } catch (e) {
    console.error('[scrape] Reviews feed never appeared. Saving debug artefacts.');
    await page.screenshot({ path: path.join(__dirname, '..', 'data', 'debug-maps.png'), fullPage: true }).catch(() => {});
    const html = await page.content();
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'debug-maps.html'), html);
    await browser.close();
    process.exit(2);
  }

  await scrollAllReviews(page, EXPECTED_REVIEWS);
  await expandAllMoreButtons(page);

  console.log('[scrape] Extracting review data...');
  const raw = await extractReviews(page);
  await browser.close();

  const enriched = raw.map((r) => ({
    name: r.name,
    course: extractCourse(r.review),
    instructor: extractInstructor(r.review),
    test_centre: extractTestCentre(r.review),
    rating: r.rating,
    date: r.date,
    review: r.review,
    image_url: r.image_url
  }));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(enriched, null, 2));
  fs.writeFileSync(OUTPUT_CSV, toCsv(enriched));
  console.log(`[scrape] Wrote ${enriched.length} reviews to:`);
  console.log(`         ${OUTPUT_CSV}`);
  console.log(`         ${OUTPUT_JSON}`);
}

main().catch((err) => {
  console.error('[scrape] Failed:', err);
  process.exit(1);
});
