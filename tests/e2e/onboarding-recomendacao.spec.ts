import { expect, test } from '@playwright/test';

/**
 * Percurso completo: cadastro → questionário → recomendações.
 * Verifica o critério de aceite mais importante do produto: a recomendação
 * precisa sair de critérios reais e vir acompanhada de explicação.
 */

test('o Perfil Verde gera recomendações explicadas', async ({ page }) => {
  const stamp = Date.now().toString(36);
  const user = {
    displayName: `Perfil ${stamp}`,
    username: `perfil${stamp}`.toLowerCase().slice(0, 20),
    email: `perfil-${stamp}@exemplo.test`,
    password: 'brota1234',
  };

  await page.goto('/cadastro');
  await page.getByLabel('Como quer ser chamado').fill(user.displayName);
  await page.getByLabel('Nome de usuário').fill(user.username);
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(user.password);
  await page.getByLabel('Confirme a senha').fill(user.password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Criar minha conta' }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  // Percorre as etapas escolhendo sempre a primeira opção disponível.
  for (let step = 0; step < 12; step += 1) {
    const finish = page.getByRole('button', { name: /ver minhas recomendações/i });
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      break;
    }

    const firstOption = page.locator('label input:not([type="hidden"])').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.check({ force: true });
    }

    await page.getByRole('button', { name: 'Continuar' }).click();
  }

  await expect(page).toHaveURL(/\/recomendacoes/, { timeout: 20_000 });

  // O rótulo do perfil precisa aparecer.
  await expect(page.getByText('Seu Perfil Verde')).toBeVisible();

  // Toda recomendação exibe o percentual E o motivo.
  const firstCard = page.locator('article').first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByText(/% compatível/)).toBeVisible();
  await expect(
    firstCard.getByText(/(Combinação|Boa combinação|Pouco compatível)/i),
  ).toBeVisible();
});
