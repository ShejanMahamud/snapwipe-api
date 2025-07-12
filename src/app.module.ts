import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { S3Module } from 'nestjs-s3';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BenefitModule } from './benefit/benefit.module';
import { ImageModule } from './image/image.module';
import { PlanModule } from './plan/plan.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    ImageModule,
    PlanModule,
    BenefitModule,
    SubscriptionModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    S3Module.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const accessKeyId = config.get<string>('S3_ACCESS_KEY');
        const secretAccessKey = config.get<string>('S3_SECRET_KEY');

        if (!accessKeyId || !secretAccessKey) {
          throw new Error(
            'Missing AWS S3 credentials in environment variables',
          );
        }

        return {
          config: {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
            region: 'ap-southeast-1',
            forcePathStyle: true,
            signatureVersion: 'v4',
          },
        };
      },
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
