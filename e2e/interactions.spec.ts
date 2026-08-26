import { expect, test } from '@playwright/test';
import { addGroupAt, openNewDiagram, pagePoint } from './helpers';

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
  await page.mouse.move(5, 5);
});

test.describe('context menu', () => {
  test('offers placement actions on empty canvas', async ({ page }) => {
    const point = await pagePoint(page, 600, 400);
    await page.mouse.click(point.x, point.y, { button: 'right' });

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('Añadir grupo de servicios');
    await expect(menu).toContainText('Añadir frontera de nube');
  });

  test('places a group exactly where the pointer was', async ({ page }) => {
    const point = await pagePoint(page, 500, 350);
    await page.mouse.click(point.x, point.y, { button: 'right' });
    await page.getByRole('menuitem', { name: 'Añadir grupo de servicios' }).click();

    await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(1);
    const rect = await page.evaluate(() => {
      const el = document.querySelector('[data-shape-id^="grp_"]')!;
      return { x: Number(el.getAttribute('x')), y: Number(el.getAttribute('y')) };
    });
    // Snapped to the grid, so within one grid step of the click.
    expect(Math.abs(rect.x - 500)).toBeLessThanOrEqual(18);
    expect(Math.abs(rect.y - 350)).toBeLessThanOrEqual(18);
  });

  test('offers shape actions on a shape, and deletes from there', async ({ page }) => {
    await addGroupAt(page, 400, 300);
    const point = await pagePoint(page, 420, 320);
    await page.mouse.click(point.x, point.y, { button: 'right' });

    await expect(page.getByRole('menu')).toContainText('Renombrar');
    await page.getByRole('menuitem', { name: /^Eliminar/ }).click();
    await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(0);
  });

  test('duplicates from the menu', async ({ page }) => {
    await addGroupAt(page, 400, 300);
    const point = await pagePoint(page, 420, 320);
    await page.mouse.click(point.x, point.y, { button: 'right' });
    await page.getByRole('menuitem', { name: /^Duplicar/ }).click();

    await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
  });

  test('offers connector actions on a connector', async ({ page }) => {
    await addGroupAt(page, 200, 200);
    await addGroupAt(page, 200, 420);

    // Click the two service cards themselves, wherever they ended up.
    await page.locator('[data-tool="connector"]').click();
    const cards = page.locator('[data-shape-id^="itm_"]');
    await expect(cards).toHaveCount(2);
    for (const index of [0, 1]) {
      const box = (await cards.nth(index).boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await expect(page.locator('.canvas-surface path[marker-end]')).toHaveCount(1);

    // Right-click the midpoint of the connector's hit path.
    const path = (await page.locator('.canvas-surface path[marker-end]').boundingBox())!;
    await page.mouse.click(path.x + path.width / 2, path.y + path.height / 2, { button: 'right' });

    await expect(page.getByRole('menu')).toContainText('Invertir sentido');
    await page.getByRole('menuitem', { name: 'Línea discontinua' }).click();
    await expect(page.locator('.canvas-surface path[stroke-dasharray]')).toHaveCount(1);
  });

  test('closes on Escape and on a click elsewhere', async ({ page }) => {
    const point = await pagePoint(page, 600, 400);
    await page.mouse.click(point.x, point.y, { button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);

    await page.mouse.click(point.x, point.y, { button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    const elsewhere = await pagePoint(page, 200, 200);
    await page.mouse.click(elsewhere.x, elsewhere.y);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('stays inside the window near an edge', async ({ page }) => {
    const box = (await page.locator('.canvas-surface').boundingBox())!;
    await page.mouse.click(box.x + box.width - 12, box.y + box.height - 12, { button: 'right' });

    const menu = (await page.getByRole('menu').boundingBox())!;
    expect(menu.x + menu.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(menu.y + menu.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  });
});

test.describe('selection toolbar', () => {
  test('appears only for a multi-selection', async ({ page }) => {
    await addGroupAt(page, 200, 200);
    await expect(page.locator('.selection-toolbar')).toHaveCount(0);

    await addGroupAt(page, 800, 500);
    await page.keyboard.press('ControlOrMeta+a');
    await expect(page.locator('.selection-toolbar')).toBeVisible();
    // Select-all takes the groups and their items; the toolbar aligns the
    // outermost of them, which is the two groups.
    await expect(page.locator('.selection-count')).toContainText('4');
  });

  test('aligns the selection', async ({ page }) => {
    await addGroupAt(page, 150, 150);
    await addGroupAt(page, 700, 500);
    await page.keyboard.press('ControlOrMeta+a');

    await page.getByRole('button', { name: 'Alinear a la izquierda' }).click();
    const xs = await page.evaluate(() =>
      [...document.querySelectorAll('[data-shape-id^="grp_"]')].map((el) =>
        Number(el.getAttribute('x')),
      ),
    );
    expect(new Set(xs).size).toBe(1);
  });

  test('spacing needs three shapes', async ({ page }) => {
    await addGroupAt(page, 150, 150);
    await addGroupAt(page, 700, 500);
    await page.keyboard.press('ControlOrMeta+a');
    await expect(page.getByRole('button', { name: 'Espaciar en horizontal' })).toBeDisabled();
  });

  test('an alignment is one undo step', async ({ page }) => {
    await addGroupAt(page, 150, 150);
    await addGroupAt(page, 700, 500);
    await page.keyboard.press('ControlOrMeta+a');

    const before = await page.evaluate(() =>
      [...document.querySelectorAll('[data-shape-id^="grp_"]')].map((el) => el.getAttribute('x')),
    );
    await page.getByRole('button', { name: 'Alinear a la izquierda' }).click();
    await page.keyboard.press('ControlOrMeta+z');

    const after = await page.evaluate(() =>
      [...document.querySelectorAll('[data-shape-id^="grp_"]')].map((el) => el.getAttribute('x')),
    );
    expect(after).toEqual(before);
  });
});

test('the floating chrome does not overlap itself', async ({ page }) => {
  // The dock is centred with a transform; an entrance animation that reset
  // `transform` dropped it onto the zoom controls and made tools unclickable.
  await page.waitForTimeout(400);
  const boxes = await page.evaluate(() =>
    ['.tool-dock', '.zoom-controls'].map((selector) => {
      const rect = document.querySelector(selector)!.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    }),
  );
  const [dock, zoom] = boxes;
  const overlaps =
    dock.left < zoom.right &&
    dock.right > zoom.left &&
    dock.top < zoom.bottom &&
    dock.bottom > zoom.top;
  expect(overlaps).toBe(false);
});
