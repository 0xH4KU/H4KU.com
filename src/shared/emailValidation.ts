import isEmail from 'validator/lib/isEmail';
import type { IsEmailOptions } from 'validator/lib/isEmail';

const EMAIL_VALIDATION_OPTIONS: IsEmailOptions = {
  allow_display_name: false,
  allow_utf8_local_part: true,
  allow_ip_domain: false,
  require_tld: true,
};

export const normalizeEmail = (email: string) => email.trim();

export const isValidEmail = (email: string): boolean => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  return isEmail(normalized, EMAIL_VALIDATION_OPTIONS);
};

export type { IsEmailOptions };
