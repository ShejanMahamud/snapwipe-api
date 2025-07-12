import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(@InjectQueue('mailer') private mailerQueue: Queue) {}

  async sendWelcomeEmail(to: string, name: string, url: string) {
    await this.mailerQueue.add(
      'send-welcome',
      {
        to,
        name,
        url,
        year: new Date().getFullYear(),
      },
      {
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 3600 * 24,
        },
      },
    );
  }
  async passwordResetEmail(to: string, name: string, url: string) {
    await this.mailerQueue.add(
      'send-reset-password',
      {
        to,
        name,
        url,
        year: new Date().getFullYear(),
      },
      {
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 3600 * 24,
        },
      },
    );
  }
  async sendVerifyEmail(to: string, name: string, url: string) {
    await this.mailerQueue.add(
      'send-verify',
      {
        to,
        name,
        url,
        year: new Date().getFullYear(),
      },
      {
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 3600 * 24,
        },
      },
    );
  }
}
