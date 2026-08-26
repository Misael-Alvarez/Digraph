import { expect, test } from '@playwright/test';
import { openNewDiagram } from './helpers';

async function openHistory(page: import('@playwright/test').Page) {
  await page.keyboard.press('ControlOrMeta+k');
  await page.locator('.palette-input').fill('Historial');
  await page.keyboard.press('Enter');
  await expect(page.locator('.side-panel')).toBeVisible();
}

async function addGroup(page: import('@playwright/test').Page, x: number, y: number) {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x, y } });
}

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('opens the history panel showing the current state', async ({ page }) => {
  await openHistory(page);
  await expect(page.locator('.version-row.is-current')).toBeVisible();
  await expect(page.getByText('Aún no hay versiones anteriores')).toBeVisible();
});

test('saves a version and lists it', async ({ page }) => {
  await addGroup(page, 400, 300);
  await expect(page.locator('.topbar .save-status')).toContainText('Guardado');

  await openHistory(page);
  await page.getByRole('button', { name: 'Guardar versión' }).click();

  await expect(page.locator('.version-row')).toHaveCount(2);
});

test('restores an earlier version', async ({ page }) => {
  await addGroup(page, 300, 250);
  await expect(page.locator('.topbar .save-status')).toContainText('Guardado');

  await openHistory(page);
  await page.getByRole('button', { name: 'Guardar versión' }).click();
  await expect(page.locator('.version-row')).toHaveCount(2);

  // Add a second group, then go back to the one-group version.
  await addGroup(page, 700, 500);
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
  await expect(page.locator('.topbar .save-status')).toContainText('Guardado');

  await page.locator('.version-row').nth(1).getByRole('button', { name: 'Restaurar' }).click();
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(1);
});

test('a restore is itself undoable', async ({ page }) => {
  await addGroup(page, 300, 250);
  await expect(page.locator('.topbar .save-status')).toContainText('Guardado');
  await openHistory(page);
  await page.getByRole('button', { name: 'Guardar versión' }).click();
  await expect(page.locator('.version-row')).toHaveCount(2);

  await addGroup(page, 700, 500);
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
  await expect(page.locator('.topbar .save-status')).toContainText('Guardado');

  await page.locator('.version-row').nth(1).getByRole('button', { name: 'Restaurar' }).click();
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(1);

  await page.locator('.canvas-surface').click({ position: { x: 40, y: 40 } });
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
});

test('the history panel and the code panel share one column', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+/');
  await expect(page.locator('.code-panel')).toBeVisible();

  await openHistory(page);
  await expect(page.locator('.code-panel')).toHaveCount(0);
  await expect(page.locator('.side-panel')).toBeVisible();
});
