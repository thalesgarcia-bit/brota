import { expect, test } from '@playwright/test';

/* Cadastro, entrada, saída e recuperação de senha. */

function uniqueUser() {
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    displayName: `Teste ${stamp}`,
    username: `teste${stamp}`.toLowerCase().slice(0, 20),
    email: `teste-${stamp}@exemplo.test`,
    password: 'brota1234',
  };
}

test.describe('autenticação', () => {
  test('cria conta e chega ao onboarding', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('/cadastro');
    await page.getByLabel('Como quer ser chamado').fill(user.displayName);
    await page.getByLabel('Nome de usuário').fill(user.username);
    await page.getByLabel('E-mail').fill(user.email);
    await page.getByLabel('Senha', { exact: true }).fill(user.password);
    await page.getByLabel('Confirme a senha').fill(user.password);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Criar minha conta' }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Onde você mora?' }),
    ).toBeVisible();
  });

  test('recusa senha errada com mensagem genérica', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill('nao-existe@exemplo.test');
    await page.getByLabel('Senha').fill('senhaerrada1');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toContainText(/incorretos/i);
  });

  test('a recuperação de senha não revela se o e-mail existe', async ({ page }) => {
    await page.goto('/recuperar-senha');
    await page.getByLabel('E-mail').fill('qualquer@exemplo.test');
    await page.getByRole('button', { name: /enviar link/i }).click();

    await expect(page.getByText(/se houver uma conta/i)).toBeVisible();
  });
});
