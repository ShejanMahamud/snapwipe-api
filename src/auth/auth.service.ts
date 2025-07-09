import { MailerService } from '@nestjs-modules/mailer';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { Util } from 'src/utils/utils';
import { registerDto } from './dto/register.dto';
import { signinDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailer: MailerService,
  ) {}
  async signUp(dto: registerDto, req: Request) {
    await this.prisma.user.create({
      data: {
        ...dto,
        status: true,
        profilePhoto: dto.profilePhoto
          ? dto.profilePhoto
          : `https://ui-avatars.com/api/?name=${dto.name}&background=random&color=fff`,
        password: await Util.hash(dto.password),
        refreshToken: '',
      },
    });
    try {
      await this.mailer.sendMail({
        to: dto.email,
        subject: 'Welcome to SnapWipe',
        template: 'welcome',
        context: {
          name: dto.name,
          action_url: `${req.protocol}://${req.host}}`,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async signIn(dto: signinDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isMatched = await Util.match(user.password, dto.password);
    if (!isMatched) {
      throw new UnauthorizedException('Credentials Invalid');
    }
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('User not found');
    }
    const isMatched = await Util.match(user.refreshToken, refreshToken);

    if (!isMatched) {
      throw new ForbiddenException('Invalid Refresh Token');
    }
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      access_token: tokens.access_token,
    };
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [access_token, refresh_token]: [string, string] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get('ACCESS_TOKEN_EXPIRES'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('REFRESH_TOKEN_SECRET'),
        expiresIn: this.config.get('REFRESH_TOKEN_EXPIRES'),
      }),
    ]);
    return {
      access_token,
      refresh_token,
    };
  }
  async updateRefreshToken(userId: string, token: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: await Util.hash(token),
      },
    });
  }

  async logOut(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('User or user refresh token not found!');
    }
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: '',
      },
    });
  }
}
