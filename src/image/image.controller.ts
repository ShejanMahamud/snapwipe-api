import { Controller, Get } from '@nestjs/common';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private image: ImageService) {}
  @Get('buckets')
  listBuckets() {
    return;
  }
}
