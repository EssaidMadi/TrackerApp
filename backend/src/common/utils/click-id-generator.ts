import { randomBytes } from 'crypto';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Voluum-style click ID with 'd' prefix */
export function generateClickId(): string {
  const bytes = randomBytes(24);
  let id = 'd';
  for (let i = 0; i < 24; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}
