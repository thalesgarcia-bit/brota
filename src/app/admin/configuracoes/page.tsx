import type { Metadata } from 'next';

import { requirePermission } from '@/lib/auth/session';
import {
  placesStatus,
  plantIdentificationStatus,
  serverEnv,
} from '@/lib/env';
import { mailStatus } from '@/domain/mail';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';

export const metadata: Metadata = {
  title: 'Configurações',
  robots: { index: false },
};

/**
 * Estado das integrações.
 *
 * Esta página nunca mostra chaves nem valores secretos: apenas se cada serviço
 * está configurado e o que fazer quando não está.
 */
export default async function AdminSettingsPage() {
  await requirePermission('admin:manage_settings', '/admin/configuracoes');

  const env = serverEnv();
  const identification = plantIdentificationStatus();
  const places = placesStatus();
  const mail = mailStatus();

  const services = [
    {
      name: 'Identificação por imagem',
      provider: identification.provider,
      configured: identification.configured,
      reason: identification.reason,
      howTo:
        'Crie uma conta gratuita em my.plantnet.org, copie a chave de API e defina PLANTNET_API_KEY no arquivo .env.local.',
      detail: `Limite de confiança: ${Math.round(env.PLANT_ID_CONFIDENCE_THRESHOLD * 100)}%. Abaixo disso, o pedido vai para a fila administrativa.`,
    },
    {
      name: 'Mapa e estabelecimentos',
      provider: places.provider,
      configured: places.configured,
      reason: places.reason,
      howTo:
        'Usa OpenStreetMap e não exige chave. Em produção com volume, aponte OVERPASS_API_URL para uma instância própria.',
      detail: `Identificação enviada ao Nominatim: ${env.OSM_USER_AGENT}`,
    },
    {
      name: 'Envio de e-mail',
      provider: 'console',
      configured: mail.configured,
      reason: mail.reason,
      howTo:
        'Implemente um adapter de MailProvider em src/domain/mail apontando para o serviço SMTP escolhido.',
      detail:
        'Sem provedor, os links de recuperação de senha são escritos no log do servidor durante o desenvolvimento.',
    },
    {
      name: 'Armazenamento de imagens',
      provider: env.STORAGE_PROVIDER,
      configured: true,
      howTo:
        'O adapter local grava em public/uploads. Antes de publicar em plataforma efêmera, implemente um adapter S3 ou R2.',
      detail: `Limite por arquivo: ${env.MAX_UPLOAD_MB} MB.`,
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl sm:text-3xl">Configurações</h1>
        <p className="mt-1.5 max-w-2xl text-ink-600">
          Estado das integrações externas. O BROTA nunca simula um serviço: se
          algo não está configurado, a interface diz isso ao usuário.
        </p>
      </header>

      <Alert tone="info" className="mt-5">
        Nenhuma chave ou segredo aparece nesta página. As credenciais ficam
        exclusivamente em variáveis de ambiente do servidor.
      </Alert>

      <ul className="mt-6 space-y-4">
        {services.map((service) => (
          <li
            key={service.name}
            className="rounded-lg border border-ink-200 bg-white p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg">
                  <Icon
                    name={service.configured ? 'checkCircle' : 'alert'}
                    size={19}
                    className={
                      service.configured ? 'text-success-500' : 'text-warning-500'
                    }
                  />
                  {service.name}
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Provedor: <code className="font-mono">{service.provider}</code>
                </p>
              </div>
              <Badge tone={service.configured ? 'success' : 'warning'}>
                {service.configured ? 'Configurado' : 'Pendente'}
              </Badge>
            </div>

            {service.reason ? (
              <p className="mt-3 text-sm text-warning-700">{service.reason}</p>
            ) : null}

            <p className="mt-2 text-sm text-ink-600">{service.detail}</p>

            {!service.configured ? (
              <p className="mt-3 rounded-md bg-ink-25 p-3 text-sm text-ink-700">
                <strong>Como configurar: </strong>
                {service.howTo}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
