import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { QueueModule } from 'src/queue/queue.module';
import { MailService } from './mail.service';
import { MailProcessor } from './mailer.processor';

@Module({
  imports: [
    QueueModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('EMAIL_HOST'),
          port: config.get<number>('EMAIL_PORT'),
          auth: {
            user: config.get<string>('EMAIL_USER'),
            pass: config.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"No Reply - SnapWipe" <${config.get<string>('EMAIL_FROM')}>`,
        },
        template: {
          dir: join(process.cwd(), 'src', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailProcessor, MailService],
  exports: [MailService],
})
export class MailModule {}
