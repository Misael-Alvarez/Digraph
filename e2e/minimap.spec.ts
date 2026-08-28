import { expect, test } from '@playwright/test';
import { addGroupAt, openNewDiagram } from './helpers';

const zoomOf = (page: import('@playwright/test').Page) => page.locator('.zoom-value').textContent();

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('clicking the minimap moves the canvas there', async ({ page }) => {
  await addGroupAt(page, 200, 200);
  await addGroupAt(page, 900, 520);
  await page.locator('[data-tool="select"]').click();

  const map = page.locator('.minimap-surface');
  await expect(map).toBeVisible();

  const before = await page
    .locator('.canvas-root, .canvas-surface > g')
    .first()
    .getAttribute('transform');
  await map.click({ position: { x: 20, y: 20 } });
  const after = await page
    .locator('.canvas-root, .canvas-surface > g')
    .first()
    .getAttribute('transform');
  expect(after).not.toBe(before);
});

test('navigating the map does not change the zoom', async ({ page }) => {
  await addGroupAt(page, 200, 200);
  await page.locator('[data-tool="select"]').click();
  const zoom = await zoomOf(page);
  await page.locator('.minimap-surface').click({ position: { x: 150, y: 100 } });
  expect(await zoomOf(page)).toBe(zoom);
});

test('dragging across the map keeps moving the canvas', async ({ page }) => {
  await addGroupAt(page, 200, 200);
  await page.locator('[data-tool="select"]').click();
  const map = page.locator('.minimap-surface');
  const box = (await map.boundingBox())!;

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  const midway = await page.locator('.canvas-surface > g').first().getAttribute('transform');
  await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20, { steps: 5 });
  await page.mouse.up();
  const end = await page.locator('.canvas-surface > g').first().getAttribute('transform');
  expect(end).not.toBe(midway);
});
