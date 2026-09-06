import { expect, test } from '@playwright/test';

/* Fluxos públicos: qualquer visitante deve conseguir percorrer o catálogo. */

test.describe('páginas públicas', () => {
  test('a página inicial apresenta o BROTA e leva ao catálogo', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: /qual planta combina/i }),
    ).toBeVisible();

    await page.getByRole('link', { name: /explorar o catálogo/i }).first().click();
    await expect(page).toHaveURL(/\/explorar/);
  });

  test('o catálogo busca e filtra espécies', async ({ page }) => {
    await page.goto('/explorar');

    await expect(page.getByRole('heading', { name: 'Explorar espécies' })).toBeVisible();

    const cards = page.locator('article');
    await expect(cards.first()).toBeVisible();

    await page.getByRole('searchbox', { name: /buscar espécies/i }).fill('jiboia');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/q=jiboia/);
    await expect(page.getByText(/jiboia/i).first()).toBeVisible();
  });

  test('a ficha da espécie mostra segurança botânica e fontes', async ({ page }) => {
    await page.goto('/plantas/jiboia');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/jiboia/i);
    await expect(
      page.getByRole('heading', { name: 'Segurança botânica' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guia rápido' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Fontes consultadas' }),
    ).toBeVisible();
  });

  test('a página Sobre preserva os créditos obrigatórios', async ({ page }) => {
    await page.goto('/sobre');

    await expect(page.getByText('Prof. Thales Garcia')).toBeVisible();
    await expect(
      page.getByText(/alunos do 9º ano da Escola Criativa de Uberaba/i).first(),
    ).toBeVisible();
    await expect(page.getByText('Profª Mikaella de Sousa')).toBeVisible();
    await expect(page.getByText('Profª Carol Manhezzo')).toBeVisible();
    await expect(page.getByText(/Projeto de Vida/).first()).toBeVisible();
  });

  test('a área Aprender lista e abre um conteúdo', async ({ page }) => {
    await page.goto('/aprender');
    await page.getByRole('link', { name: /como regar corretamente/i }).click();
    await expect(page).toHaveURL(/\/aprender\/como-regar-corretamente/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('permissões', () => {
  test('visitante é levado ao login ao tentar entrar no admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/entrar/);
  });

  test('visitante é levado ao login ao tentar abrir o jardim', async ({ page }) => {
    await page.goto('/jardim');
    await expect(page).toHaveURL(/\/entrar/);
  });
});
