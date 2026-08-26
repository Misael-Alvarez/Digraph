import { expect, type Page } from '@playwright/test';

/** Clears stored state so every test starts from a known, empty workspace. */
export async function resetWorkspace(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    const databases = (await indexedDB.databases?.()) ?? [];
    await Promise.all(
      databases
        .filter((db) => db.name)
        .map(
          (db) =>
            new Promise<void>((resolve) => {
              const request = indexedDB.deleteDatabase(db.name!);
              request.onsuccess = request.onerror = request.onblocked = () => resolve();
            }),
        ),
    );
  });
  await page.reload();
}

/** Creates a blank diagram from the library and lands in the editor. */
export async function openNewDiagram(page: Page) {
  await resetWorkspace(page);
  await page.getByRole('button', { name: 'Nuevo diagrama' }).click();
  await page.locator('.dialog .template-card').filter({ hasText: 'Lienzo en blanco' }).click();
  await page.waitForSelector('.canvas-surface');
  await expect(page).toHaveURL(/\/d\//);
}

/** Page coordinates for a point given in canvas-element coordinates. */
export async function pagePoint(page: Page, x: number, y: number) {
  const box = await page.locator('.canvas-surface').boundingBox();
  return { x: (box?.x ?? 0) + x, y: (box?.y ?? 0) + y };
}

/** Places a service group at a point in canvas-element coordinates. */
export async function addGroupAt(page: Page, x: number, y: number) {
  await page.locator('[data-tool="group"]').click();
  await page.locator('.canvas-surface').click({ position: { x, y } });
}
