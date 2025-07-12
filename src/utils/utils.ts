import { BadRequestException } from '@nestjs/common';
import * as argon from 'argon2';
import { randomBytes } from 'crypto';
export class Util {
  static hash(string: string) {
    return argon.hash(string);
  }
  static match(hash: string, password: string) {
    return argon.verify(hash, password);
  }
  static success(message: string, data?: any, meta?: any) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      meta,
      message,
    };
  }
  static error(message: string, errors?: any[]) {
    throw new BadRequestException({ message, errors });
  }
  static generateToken() {
    return randomBytes(32).toString('hex');
  }
}
