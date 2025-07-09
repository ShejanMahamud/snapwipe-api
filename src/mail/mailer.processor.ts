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
      action_url: string;
      year: number;
    }>,
  ): Promise<any> {
    const { to, name, action_url, year } = job.data;

    return this.mailer.sendMail({
      to,
      subject: 'Welcome to SnapWipe',
      template: 'welcome',
      context: { name, action_url, year },
    });
  }
}
