import * as argon from 'argon2';

export class Util {
  static hashPassword(password: string) {
    return argon.hash(password);
  }
  static matchPassword(hash: string, password: string) {
    return argon.verify(hash, password);
  }
}
