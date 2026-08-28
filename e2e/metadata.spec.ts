import { expect, test } from '@playwright/test';
import { addGroupAt, openNewDiagram } from './helpers';

/** The item inside a freshly placed group: the shape the DSL calls a node. */
async function selectAnItem(page: import('@playwright/test').Page) {
  await addGroupAt(page, 420, 260);
  await page.locator('[data-tool="select"]').click();
  await page.locator('[data-shape-id^="itm_"]').first().click({ force: true });
  await expect(page.locator('.inspector')).toBeVisible();
}

const codeText = (page: import('@playwright/test').Page) =>
  page.locator('.code-editor .cm-content').innerText();

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('what a node is reaches the document', async ({ page }) => {
  await selectAnItem(page);
  await page.getByRole('button', { name: /Qué es/i }).click();

  await page.getByLabel('Tecnología').fill('FastAPI');
  await page.getByLabel('Responsable').fill('payments-platform');
  await page.getByLabel('Entorno').selectOption('prod');
  await page.getByLabel('Criticidad').selectOption('critical');

  await page.keyboard.press('ControlOrMeta+/');
  await expect.poll(() => codeText(page)).toContain('technology: FastAPI');
  await expect.poll(() => codeText(page)).toContain('owner: payments-platform');
  await expect.poll(() => codeText(page)).toContain('environment: prod');
  await expect.poll(() => codeText(page)).toContain('criticality: critical');
});

test('the metadata survives a reload', async ({ page }) => {
  await selectAnItem(page);
  await page.getByRole('button', { name: /Qué es/i }).click();
  await page.getByLabel('Responsable').fill('payments-platform');
  await expect(page.locator('.topbar .save-status')).toContainText('Guardado');

  await page.reload();
  await page.waitForSelector('.canvas-surface');
  await page.locator('[data-shape-id^="itm_"]').first().click({ force: true });
  await page.getByRole('button', { name: /Qué es/i }).click();
  await expect(page.getByLabel('Responsable')).toHaveValue('payments-platform');
});
