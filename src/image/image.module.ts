import { Module } from '@nestjs/common';
import { QueueModule } from 'src/queue/queue.module';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';

@Module({
  imports: [QueueModule],
  providers: [ImageService],
  controllers: [ImageController],
})
export class ImageModule {}
