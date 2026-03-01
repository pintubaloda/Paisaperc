import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

@Injectable()
export class EncryptionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isEncrypted = req.headers['x-encrypted'] === 'true';

    if (isEncrypted && req.body?.data) {
      try {
        const decryptedBody = decrypt(req.body.data);
        req.body = JSON.parse(decryptedBody);
      } catch {
        return res.status(400).json({ message: 'Invalid encrypted payload' });
      }
    }

    if (isEncrypted) {
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const encrypted = encrypt(JSON.stringify(body));
        return originalJson({ data: encrypted, encrypted: true });
      };
    }

    next();
  }
}
