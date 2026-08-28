import { expect, test } from '@playwright/test';
import { addGroupAt, openNewDiagram } from './helpers';

/**
 * Placing a group creates an item inside it, and the item is the shape that
 * carries an icon — so it is the one whose inspector shows the picker.
 */
async function selectAnItem(page: import('@playwright/test').Page) {
  await addGroupAt(page, 500, 320);
  await page.locator('[data-tool="select"]').click();
  await page.locator('[data-shape-id^="itm_"]').first().click({ force: true });
  await expect(page.locator('.inspector')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('the icon field opens a picker grouped by cloud and by area', async ({ page }) => {
  await selectAnItem(page);

  // Closed until asked for: the panel must not cost the inspector its height.
  await expect(page.locator('.icon-picker')).toHaveCount(0);
  await page.locator('.icon-picker-trigger').click();
  await expect(page.locator('.icon-picker')).toBeVisible();

  // One tab per cloud, and functional areas as sections inside the chosen one.
  await expect(page.locator('.icon-picker-cloud')).toHaveCount(7);
  // It opens on the cloud the icon in use belongs to — a new item defaults to
  // Cloud Run, so that is GCP, not the first tab.
  await expect(page.locator('.icon-picker-cloud.is-active')).toContainText('GCP');
  await expect(page.locator('.icon-picker-tile.is-current')).toHaveCount(1);
  expect(await page.locator('.icon-picker-section').count()).toBeGreaterThan(1);

  await page.locator('.icon-picker-cloud').filter({ hasText: 'AWS' }).click();
  await expect(page.locator('.icon-picker-cloud.is-active')).toContainText('AWS');
  await expect(page.locator('.icon-picker-tile').first()).toBeVisible();
  // Switching cloud shows that cloud only: the current GCP icon is not here.
  await expect(page.locator('.icon-picker-tile.is-current')).toHaveCount(0);
});

test('a section collapses so a long cloud stays browsable', async ({ page }) => {
  await selectAnItem(page);
  await page.locator('.icon-picker-trigger').click();

  const first = page.locator('.icon-picker-section').first();
  const before = await first.locator('.icon-picker-tile').count();
  expect(before).toBeGreaterThan(0);

  await first.locator('.icon-picker-section-header').click();
  await expect(first.locator('.icon-picker-tile')).toHaveCount(0);
});

test('search crosses every cloud, and the count admits what it is not showing', async ({
  page,
}) => {
  await selectAnItem(page);
  await page.locator('.icon-picker-trigger').click();

  await page.locator('.icon-picker-search-input').fill('kubernetes');
  // The tabs are gone: a search is not scoped to one cloud.
  await expect(page.locator('.icon-picker-cloud')).toHaveCount(0);
  const labels = await page.locator('.icon-picker-tile-label').allInnerTexts();
  expect(labels.join(' ')).toContain('EKS');
  expect(labels.join(' ')).toContain('GKE');

  await page.locator('.icon-picker-search-input').fill('no existe ningun servicio asi');
  await expect(page.locator('.icon-picker-tile')).toHaveCount(0);
  await expect(page.locator('.icon-picker-footer')).toContainText('0');
});

test('picking an icon applies it, closes the picker and is undoable', async ({ page }) => {
  await selectAnItem(page);
  await page.locator('.icon-picker-trigger').click();
  await page.locator('.icon-picker-search-input').fill('lambda');

  const chosen = page.locator('.icon-picker-tile').first();
  const label = (await chosen.locator('.icon-picker-tile-label').innerText()).trim();
  await chosen.click();

  await expect(page.locator('.icon-picker')).toHaveCount(0);
  await expect(page.locator('.icon-picker-trigger')).toContainText(label);

  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.icon-picker-trigger')).not.toContainText(label);
});

test('the picker reopens on the icon in use rather than at the top', async ({ page }) => {
  await selectAnItem(page);
  await page.locator('.icon-picker-trigger').click();
  await page.locator('.icon-picker-search-input').fill('route 53');
  await page.locator('.icon-picker-tile').first().click();

  await page.locator('.icon-picker-trigger').click();
  const current = page.locator('.icon-picker-tile.is-current');
  await expect(current).toHaveCount(1);
  // Scrolled to, not merely present: the list is far taller than the panel.
  await expect(current).toBeInViewport();
});

test('escape closes the picker without clearing the selection', async ({ page }) => {
  await selectAnItem(page);
  await page.locator('.icon-picker-trigger').click();
  await expect(page.locator('.icon-picker')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('.icon-picker')).toHaveCount(0);
  // The shape stays selected — otherwise Escape would take the inspector,
  // and the picker's own trigger, away with it.
  await expect(page.locator('.inspector')).toBeVisible();
});
