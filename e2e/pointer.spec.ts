import { expect, test } from '@playwright/test';
import { addGroupAt, openNewDiagram, pagePoint } from './helpers';

const groupBox = (page: import('@playwright/test').Page) =>
  page.locator('[data-shape-id^="grp_"]').first();

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

/** Turns the grid off, which is what stops a small move from rounding to zero. */
async function disableGridSnap(page: import('@playwright/test').Page) {
  await page.keyboard.press('ControlOrMeta+k');
  await page.locator('.palette input').first().fill('cuadr');
  await page.keyboard.press('Enter');
  await expect(page.locator('.palette')).toHaveCount(0);
}

test('a sloppy click does not nudge the shape it lands on', async ({ page }) => {
  await addGroupAt(page, 420, 260);
  await page.locator('[data-tool="select"]').click();
  await disableGridSnap(page);

  const group = groupBox(page);
  const before = await group.getAttribute('x');

  // Two pixels: the wobble of a hand pressing a button, not a drag. Snapping
  // used to turn it into a real move.
  const from = await pagePoint(page, 430, 268);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 2, from.y + 2, { steps: 2 });
  // Long enough for the drag's own animation frame to land: without the wait
  // the gesture ends before anything is computed, which passes for the wrong
  // reason.
  await page.waitForTimeout(80);
  await page.mouse.up();

  expect(await group.getAttribute('x')).toBe(before);
});

test('a deliberate drag still moves it', async ({ page }) => {
  await addGroupAt(page, 420, 260);
  await page.locator('[data-tool="select"]').click();

  const group = groupBox(page);
  const before = Number(await group.getAttribute('x'));

  const from = await pagePoint(page, 430, 268);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 120, from.y + 40, { steps: 8 });
  await page.mouse.up();

  expect(Number(await group.getAttribute('x'))).toBeGreaterThan(before + 50);
});

test('the resize handle keeps its size on screen at any zoom', async ({ page }) => {
  await addGroupAt(page, 420, 260);
  await page.locator('[data-tool="select"]').click();
  await page.locator('[data-shape-id^="grp_"]').first().click({ force: true });

  const handle = page.locator('.resize-handle');
  await expect(handle).toBeVisible();
  const atOne = (await handle.boundingBox())!.width;

  // Zoomed out, the handle used to shrink with the diagram until it could not
  // be hit at all.
  await page.locator('[aria-label="Alejar"], .zoom-controls .icon-button').first().click();
  await page.locator('[aria-label="Alejar"], .zoom-controls .icon-button').first().click();
  const zoomedOut = (await handle.boundingBox())!.width;

  expect(Math.abs(zoomedOut - atOne)).toBeLessThan(2);
});
