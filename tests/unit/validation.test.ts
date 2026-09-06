import { describe, expect, it } from 'vitest';

import { passwordSchema, signUpSchema, usernameSchema } from '@/lib/validation/auth';
import { createPostSchema } from '@/lib/validation/post';
import { plantSearchSchema } from '@/lib/validation/plant';
import { onboardingSchema } from '@/lib/validation/onboarding';

describe('cadastro', () => {
  it('exige senha com letra e número', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
    expect(passwordSchema.safeParse('abc12345').success).toBe(true);
  });

  it('recusa nomes de usuário inválidos ou reservados', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false);
    expect(usernameSchema.safeParse('com espaço').success).toBe(false);
    expect(usernameSchema.safeParse('admin').success).toBe(false);
    expect(usernameSchema.safeParse('denise.almeida').success).toBe(true);
  });

  it('normaliza o e-mail para minúsculas', () => {
    const result = signUpSchema.safeParse({
      displayName: 'Denise',
      username: 'denise',
      email: 'DENISE@Exemplo.COM',
      password: 'senha1234',
      passwordConfirmation: 'senha1234',
      acceptedTerms: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('denise@exemplo.com');
  });

  it('exige confirmação de senha igual', () => {
    const result = signUpSchema.safeParse({
      displayName: 'Denise',
      username: 'denise',
      email: 'denise@exemplo.com',
      password: 'senha1234',
      passwordConfirmation: 'outra1234',
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it('exige aceite dos termos', () => {
    const result = signUpSchema.safeParse({
      displayName: 'Denise',
      username: 'denise',
      email: 'denise@exemplo.com',
      password: 'senha1234',
      passwordConfirmation: 'senha1234',
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
  });
});

describe('publicação', () => {
  it('exige ao menos uma foto', () => {
    const result = createPostSchema.safeParse({
      type: 'MY_PLANT',
      caption: 'Minha jiboia cresceu.',
      imageIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('limita a seis fotos', () => {
    const result = createPostSchema.safeParse({
      type: 'MY_PLANT',
      caption: 'Minha jiboia cresceu.',
      imageIds: Array.from({ length: 7 }, (_, i) => `/uploads/${i}.webp`),
    });
    expect(result.success).toBe(false);
  });

  it('permite comentários por padrão', () => {
    const result = createPostSchema.safeParse({
      type: 'TIP',
      caption: 'Regue pela base, não por cima.',
      imageIds: ['/uploads/a.webp'],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allowComments).toBe(true);
  });
});

describe('filtros do catálogo', () => {
  it('aceita a query string vazia com valores padrão', () => {
    const result = plantSearchSchema.parse({});
    expect(result.pagina).toBe(1);
    expect(result.ordenar).toBe('relevancia');
    expect(result.petFriendly).toBe(false);
  });

  it('recusa valores fora do enum', () => {
    expect(plantSearchSchema.safeParse({ luz: ['NEON'] }).success).toBe(false);
  });

  it('limita a paginação', () => {
    expect(plantSearchSchema.safeParse({ pagina: '0' }).success).toBe(false);
    expect(plantSearchSchema.safeParse({ pagina: '999999' }).success).toBe(false);
  });
});

describe('onboarding', () => {
  it('exige ao menos um lugar e um objetivo', () => {
    const base = {
      housing: 'APARTMENT',
      placements: [],
      light: 'BRIGHT_INDIRECT',
      lightUnsure: false,
      careTime: 'WEEKLY',
      experience: 'BEGINNER',
      goals: [],
      preferences: [],
      climate: 'MILD',
      space: 'SMALL',
    };
    expect(onboardingSchema.safeParse(base).success).toBe(false);
  });

  it('aceita luminosidade nula quando o usuário não sabe', () => {
    const result = onboardingSchema.safeParse({
      housing: 'APARTMENT',
      placements: ['INDOOR'],
      light: null,
      lightUnsure: true,
      careTime: 'WEEKLY',
      experience: 'NONE',
      goals: ['decoracao'],
      preferences: [],
      climate: 'UNSURE',
      space: 'TINY',
    });
    expect(result.success).toBe(true);
  });
});
