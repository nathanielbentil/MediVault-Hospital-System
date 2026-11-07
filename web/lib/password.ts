import crypto from 'crypto';
import * as argon2 from '@node-rs/argon2';

export class PasswordService {
  private static readonly PEPPER_V1 = (process.env.PEPPER_V1 || '58ccdb65b61dfa1586e00d6cf4268f24d09d0c4ad69e7cfb555184c3fc02f91e')
    .trim()
    .replace(/^["']|["']$/g, '');

  /**
   * Layer 1: Apply server-side HMAC Pepper (256-bit entropy)
   */
  public static pepper(password: string, pepperVersion: string = 'v1'): string {
    const pepperSecret = pepperVersion === 'v1' ? this.PEPPER_V1 : this.PEPPER_V1;
    return crypto.createHmac('sha256', pepperSecret).update(password).digest('hex');
  }

  /**
   * Verify password against Argon2id hash + Pepper
   */
  public static async verify(
    plainPassword: string,
    storedHash: string,
    pepperVersion: string = 'v1'
  ): Promise<boolean> {
    try {
      // 1. Standard HMAC Peppered verification
      const peppered = this.pepper(plainPassword, pepperVersion);
      if (await argon2.verify(storedHash, peppered)) {
        return true;
      }

      // 2. Fallback direct check (if hash was created without pepper)
      if (await argon2.verify(storedHash, plainPassword)) {
        return true;
      }

      // 3. Tolerant check for accidental whitespace
      const trimmed = plainPassword.trim();
      if (trimmed !== plainPassword) {
        const trimmedPeppered = this.pepper(trimmed, pepperVersion);
        if (
          (await argon2.verify(storedHash, trimmedPeppered)) ||
          (await argon2.verify(storedHash, trimmed))
        ) {
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Password verification error:', err);
      return false;
    }
  }

  /**
   * Hash a raw password using HMAC Pepper + Argon2id
   */
  public static async hash(
    plainPassword: string,
    pepperVersion: string = 'v1'
  ): Promise<{ hash: string; pepper_version: string }> {
    const peppered = this.pepper(plainPassword, pepperVersion);
    const hash = await argon2.hash(peppered, {
      memoryCost: 65536,
      timeCost: 4,
      parallelism: 2,
      algorithm: 2, // Argon2id numeric constant
    });

    return {
      hash,
      pepper_version: pepperVersion,
    };
  }

  /**
   * Extract explicit salt substring from Argon2id MCF string ($argon2id$v=19$m=...$SALT$HASH)
   */
  public static extractSalt(hash: string): string {
    const parts = hash.split('$');
    return parts[4] || '';
  }
}
