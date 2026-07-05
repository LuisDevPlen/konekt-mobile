const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s()+-]{8,20}$/;

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
  if (!phone.trim()) return 'Telefone é obrigatório';
  if (!PHONE_RE.test(phone)) return 'Telefone inválido';
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
