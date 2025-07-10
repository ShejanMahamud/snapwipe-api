import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mailer',
    }),
    BullModule.registerQueue({
      name: 'file-upload',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
