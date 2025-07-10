import { Injectable } from '@nestjs/common';
import { InjectS3, S3 } from 'nestjs-s3';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ImageService {
  constructor(
    @InjectS3() private s3: S3,
    private prisma: PrismaService,
  ) {}

  listBuckets() {
    return;
  }
}
