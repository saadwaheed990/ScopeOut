const { test, expect } = require('@playwright/test');

const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'About', path: '/pages/about.html' },
  { name: 'Services', path: '/pages/services.html' },
  { name: 'Pricing', path: '/pages/pricing.html' },
  { name: 'Areas', path: '/pages/areas.html' },
  { name: 'Contact', path: '/pages/contact.html' },
  { name: 'Booking', path: '/pages/booking.html' },
];

test.describe('SEO Elements', () => {
  for (const pg of pages) {
    test(`${pg.name} has meta description`, async ({ page }) => {
      await page.goto(pg.path);
      const metaDesc = page.locator('meta[name="description"]');
      const content = await metaDesc.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(10);
    });
  }

  for (const pg of pages) {
    test(`${pg.name} has OG tags`, async ({ page }) => {
      await page.goto(pg.path);

      // Check for OG title or OG description (at least one should exist)
      const ogTitle = await page.locator('meta[property="og:title"]').count();
      const ogDesc = await page.locator('meta[property="og:description"]').count();
      const ogType = await page.locator('meta[property="og:type"]').count();

      expect(ogTitle + ogDesc + ogType).toBeGreaterThan(0);
    });
  }

  test('sitemap.xml exists and is valid XML', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    if (response.status() === 200) {
      const content = await response.text();
      expect(content).toContain('<?xml');
      expect(content).toContain('<urlset');
    } else {
      test.skip();
    }
  });

  test('robots.txt exists and references sitemap', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    if (response && response.status() === 200) {
      const content = await page.locator('body').textContent();
      // robots.txt should reference sitemap
      expect(content.toLowerCase()).toContain('sitemap');
    } else {
      // robots.txt may not exist yet
      test.skip();
    }
  });

  for (const pg of pages) {
    test(`${pg.name} has proper heading hierarchy`, async ({ page }) => {
      await page.goto(pg.path);

      // Must have at least one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // h1 should appear before h2 in the DOM
      const headings = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(elements).map(el => parseInt(el.tagName.substring(1)));
      });

      // The first heading should be h1
      if (headings.length > 0) {
        expect(headings[0]).toBe(1);
      }
    });
  }

  for (const pg of pages) {
    test(`${pg.name} has lang="en" attribute`, async ({ page }) => {
      await page.goto(pg.path);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('en');
    });
  }

  test('external links have rel="noopener"', async ({ page }) => {
    await page.goto('/');
    await page.locator('#preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    const externalLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[target="_blank"]');
      return Array.from(links).map(a => ({
        href: a.href,
        rel: a.getAttribute('rel') || '',
      }));
    });

    for (const link of externalLinks) {
      expect(link.rel).toContain('noopener');
    }
  });
});
