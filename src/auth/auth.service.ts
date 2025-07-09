import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { MailService } from 'src/mail/mail.service';
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
    private mailer: MailService,
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
      },
    });
    await this.mailer.sendWelcomeEmail(
      dto.email,
      dto.name,
      `${req.protocol}://${req.get('host')}`,
    );
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

  async sendResetPasswordEmail(email: string, req: Request) {
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await Util.hash(resetToken);
    const user = await this.prisma.user.update({
      where: {
        email,
        status: true,
        isDeleted: false,
      },
      data: {
        resetToken: hashedToken,
        resetTokenExp: new Date(Date.now() + 1000 * 60 * 15),
      },
    });
    if (!user) throw new NotFoundException('User not found!');
    const resetUrl = `${req.protocol}://${req.get('host')}/rt=${resetToken}&uid=${user.id}`;
    await this.mailer.passwordResetEmail(user.email, user.name, resetUrl);
    return { message: 'Reset email sent' };
  }

  async resetPassword(rt: string, uid: string, newPassword: string) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: uid,
          status: true,
          isDeleted: false,
        },
      });
      if (!user || !user.resetToken || !user.resetTokenExp) {
        throw new UnauthorizedException('User not found!');
      }
      const isMatched = await Util.match(user.resetToken, rt);
      if (!isMatched)
        throw new UnauthorizedException('Reset Token is not valid!');
      if (user.resetTokenExp < new Date())
        throw new ForbiddenException('Reset token is expired');

      await this.prisma.user.update({
        where: {
          id: user.id,
          status: true,
          isDeleted: false,
        },
        data: {
          password: newPassword,
        },
      });
    });
    return { message: 'Password successfully reset' };
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
