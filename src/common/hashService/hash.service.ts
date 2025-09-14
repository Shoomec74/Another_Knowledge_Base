import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class HashService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    this.key = Buffer.from(this.configService.get<string>('HASH_KEY'), 'hex');
  }

  //-- Генерация хэша для пароля --//
  async getHash(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  //-- Проверка соответствия пароля его хэшу --//
  async hashCompare(data: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(data, hash);
  }

  //-- Шифрование --//
  async encrypt(text: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher: crypto.Cipher = crypto.createCipheriv(
      this.algorithm,
      this.key,
      iv,
    );

    // Кодируем в Base64 перед шифрованием
    const base64Text = Buffer.from(text).toString('base64');
    let encrypted: string = cipher.update(base64Text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  //-- Расшифровка --//
  async decrypt(encryptedData: string): Promise<string> {
    const [iv, encrypt] = encryptedData.split(':');

    const decipher: crypto.Decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex'),
    );

    let decrypted: string = decipher.update(encrypt, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Декодируем из Base64 после дешифрации
    return Buffer.from(decrypted, 'base64').toString('utf8');
  }
}
