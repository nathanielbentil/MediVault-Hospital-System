import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'c9b0e1293a54b38d0e74f82635bc579f1a23847596adbe817264859a8cde1029';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export class AuthService {
  public static signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  public static signTemp2FAToken(userId: number): string {
    return jwt.sign({ userId, type: '2fa_challenge' }, JWT_SECRET, { expiresIn: '5m' });
  }

  public static verifyTemp2FAToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.type === '2fa_challenge') {
        return { userId: decoded.userId };
      }
      return null;
    } catch {
      return null;
    }
  }
}
