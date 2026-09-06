'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker que dá ao BROTA comportamento de aplicativo:
 * instalação no celular, ícone próprio e funcionamento parcial sem conexão
 * para o que já foi acessado.
 *
 * Em desenvolvimento o registro é evitado — cache atrapalha o hot reload.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Registro falhou: o BROTA continua funcionando normalmente online.
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
