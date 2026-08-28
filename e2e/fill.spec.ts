import { expect, test } from '@playwright/test';
import { addGroupAt, openNewDiagram } from './helpers';

/** The item inside a freshly placed group: the shape the inspector is richest for. */
async function selectAnItem(page: import('@playwright/test').Page) {
  await addGroupAt(page, 500, 320);
  await page.locator('[data-tool="select"]').click();
  const item = page.locator('[data-shape-id^="itm_"]').first();
  await item.click({ force: true });
  await expect(page.locator('.inspector')).toBeVisible();
  return item;
}

const fillField = (page: import('@playwright/test').Page) =>
  page.locator('.inspector .color-field .input');

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('the chosen colour actually paints the shape', async ({ page }) => {
  // It did not, for as long as the field existed: items and boundaries never
  // read their own fill.
  const item = await selectAnItem(page);
  await fillField(page).fill('#123456');
  await expect(item).toHaveAttribute('fill', '#123456');
});

test('a colour the canvas cannot paint never reaches it', async ({ page }) => {
  const item = await selectAnItem(page);
  const before = await item.getAttribute('fill');

  await fillField(page).fill('rojo');
  await expect(fillField(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(item).toHaveAttribute('fill', before!);

  // Half a colour is not a colour either: nothing is committed mid-typing.
  await fillField(page).fill('#12');
  await expect(item).toHaveAttribute('fill', before!);
});

test('emptying the field gives the shape the theme back', async ({ page }) => {
  const item = await selectAnItem(page);
  const themed = await item.getAttribute('fill');

  await fillField(page).fill('#123456');
  await expect(item).toHaveAttribute('fill', '#123456');

  await fillField(page).fill('');
  await expect(item).toHaveAttribute('fill', themed!);
});

/** Picks a service by name from the inspector's icon picker. */
async function chooseService(page: import('@playwright/test').Page, query: string) {
  await page.locator('.icon-picker-trigger').click();
  await page.locator('.icon-picker-search-input').fill(query);
  await page.locator('.icon-picker-tile').first().click();
}

test('the cloud switch offers the clouds the service exists in', async ({ page }) => {
  await selectAnItem(page);
  await chooseService(page, 'lambda');

  // Lambda has a counterpart in all five, and each row says which one.
  const options = page.locator('.cloud-option');
  await expect(options).toHaveCount(5);
  await expect(options.first()).toContainText('AWS');
  await expect(options.first()).toContainText('Lambda');
  // The cloud it is already in is shown, not offered.
  await expect(options.first()).toBeDisabled();
});

test('a cloud with no counterpart is not offered at all', async ({ page }) => {
  await selectAnItem(page);
  // App Mesh exists in three of the five clouds; the other two used to be
  // buttons that did nothing when pressed.
  await chooseService(page, 'app mesh');

  const options = page.locator('.cloud-option');
  await expect(options).toHaveCount(3);
  const labels = (await options.allTextContents()).join(' ');
  expect(labels).not.toContain('Azure');
  expect(labels).not.toContain('IBM');
});
