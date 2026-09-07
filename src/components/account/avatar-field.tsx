'use client';

import { useRef, useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { uploadImage } from '@/lib/image/compress';

/**
 * Foto de perfil.
 *
 * A imagem é reduzida e convertida no próprio navegador antes de subir — quem
 * usa o BROTA de celular na escola não deveria gastar o pacote de dados
 * mandando uma foto de 8 MB. O endereço final viaja num campo escondido, junto
 * com o resto do formulário, e só é gravado quando a pessoa salva.
 */
export function AvatarField({
  nome,
  inicial,
}: {
  nome: string;
  inicial: string | null;
}) {
  const { notify } = useToast();
  const entrada = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(inicial);
  const [enviando, setEnviando] = useState(false);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;

    setEnviando(true);
    try {
      const enviada = await uploadImage(arquivo, 'avatars');
      setUrl(enviada.url);
      notify('Foto carregada. Salve para confirmar.', 'success');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Não conseguimos enviar a foto.',
        'error',
      );
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-ink-200 p-4">
      <input type="hidden" name="avatarUrl" value={url ?? ''} />

      <Avatar name={nome} src={url} size="xl" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-800">Foto de perfil</p>
        <p className="mt-0.5 text-xs text-ink-500">
          JPG, PNG ou WebP. Ela é recortada em círculo.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            iconLeft="camera"
            loading={enviando}
            onClick={() => entrada.current?.click()}
          >
            {url ? 'Trocar foto' : 'Escolher foto'}
          </Button>

          {url ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              iconLeft="trash"
              className="text-danger-700 hover:bg-danger-50"
              onClick={() => setUrl(null)}
            >
              Remover
            </Button>
          ) : null}
        </div>

        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void escolher(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}
