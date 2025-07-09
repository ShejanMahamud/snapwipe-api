import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mailer',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
