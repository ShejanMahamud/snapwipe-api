import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mailer', { concurrency: 10 })
export class MailProcessor extends WorkerHost {
  constructor(private mailer: MailerService) {
    super();
  }
  async process(
    job: Job<{
      to: string;
      name: string;
      url: string;
      year: number;
    }>,
  ): Promise<any> {
    const { to, name, url, year } = job.data;

    if (job.name === 'send-welcome') {
      return await this.mailer.sendMail({
        to,
        subject: 'Welcome to SnapWipe',
        template: 'welcome',
        context: { name, url, year },
      });
    }
    if (job.name === 'send-reset-password') {
      return await this.mailer.sendMail({
        to,
        subject: 'Reset Your Password',
        template: 'reset-password',
        context: { name, url, year },
      });
    }
  }
}
