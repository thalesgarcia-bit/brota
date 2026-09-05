import 'server-only';

/* ===========================================================================
 * ENVIO DE E-MAIL
 *
 * Mesma regra dos outros serviços externos: a infraestrutura existe inteira,
 * e o estado de configuração é declarado com honestidade. Sem provedor
 * configurado, nada é "fingido" — a interface avisa e o link é registrado no
 * log do servidor durante o desenvolvimento.
 * =========================================================================== */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface MailProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(message: MailMessage): Promise<void>;
}

/** Provedor de desenvolvimento: escreve a mensagem no log do servidor. */
class ConsoleMailProvider implements MailProvider {
  readonly name = 'console';

  isConfigured(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  async send(message: MailMessage): Promise<void> {
    // eslint-disable-next-line no-console
    console.info(
      `\n[BROTA · e-mail não enviado — nenhum provedor SMTP configurado]\n` +
        `Para: ${message.to}\nAssunto: ${message.subject}\n\n${message.text}\n`,
    );
  }
}

let cached: MailProvider | null = null;

export function getMailProvider(): MailProvider {
  cached ??= new ConsoleMailProvider();
  return cached;
}

export function mailStatus(): { configured: boolean; reason?: string } {
  const provider = getMailProvider();
  if (provider.name === 'console') {
    return {
      configured: false,
      reason:
        'Nenhum provedor de e-mail configurado. Em desenvolvimento, as mensagens aparecem no log do servidor.',
    };
  }
  return { configured: true };
}
