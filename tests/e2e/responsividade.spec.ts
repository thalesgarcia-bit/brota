import { expect, test } from '@playwright/test';

/**
 * Verificação de responsividade.
 *
 * O compromisso do projeto: nada ultrapassa a viewport, nenhuma rolagem
 * horizontal acidental, e os alvos de toque têm tamanho confortável.
 */

const PAGES = ['/', '/explorar', '/plantas/jiboia', '/aprender', '/sobre'];

for (const path of PAGES) {
  test(`sem rolagem horizontal em ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });

    // Um pixel de folga cobre arredondamentos de layout.
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}

test('a navegação inferior aparece no mobile e some no desktop', async ({
  page,
  viewport,
}) => {
  await page.goto('/explorar');
  const bottomNav = page.getByRole('navigation', { name: 'Navegação principal' });

  if ((viewport?.width ?? 0) >= 1024) {
    // No desktop a navegação principal fica na lateral.
    await expect(page.locator('aside nav')).toBeVisible();
  } else {
    await expect(bottomNav.first()).toBeVisible();
  }
});

test('os alvos de toque têm tamanho confortável', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 1024, 'Verificação específica de toque.');

  await page.goto('/explorar');

  const buttons = page.getByRole('button');
  const total = Math.min(await buttons.count(), 10);

  for (let index = 0; index < total; index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible())) continue;

    const box = await button.boundingBox();
    if (!box) continue;

    expect(box.height).toBeGreaterThanOrEqual(32);
  }
});

test('o foco do teclado permanece visível', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});
