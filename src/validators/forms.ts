const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only digits from a phone string. */
export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Brazilian phone mask:
 * (11) 98888-8888  (11 digits mobile)
 * (11) 3333-4444   (10 digits landline)
 */
export function formatPhoneMask(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'E-mail é obrigatório';
  if (!EMAIL_RE.test(email)) return 'E-mail inválido';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Senha é obrigatória';
  if (password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
  return null;
}

export function validatePhone(phone: string): string | null {
  const digits = digitsOnly(phone);
  if (!digits) return 'Telefone é obrigatório';
  if (digits.length < 10 || digits.length > 11) {
    return 'Telefone inválido. Use DDD + número.';
  }
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} é obrigatório`;
  return null;
}

export function validateTenantSlug(slug: string): string | null {
  if (!slug.trim()) return 'Código da empresa é obrigatório';
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Código inválido';
  return null;
}
