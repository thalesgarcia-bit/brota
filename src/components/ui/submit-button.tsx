'use client';

import { useFormStatus } from 'react-dom';

import { Button, type ButtonProps } from './button';

/** Botão de envio que mostra o estado de carregamento do formulário. */
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}
