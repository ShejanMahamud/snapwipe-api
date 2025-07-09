import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from 'src/mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy, JwtStrategy } from './strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
