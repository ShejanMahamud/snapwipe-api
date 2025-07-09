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
import { ChangePasswordDto } from './dto/change-password.dto';
import { registerDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
    return { message: 'User registered successfully' };
  }

  async signIn(dto: signinDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        email: true,
        id: true,
        password: true,
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
    const user = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          email,
          status: true,
          isDeleted: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      if (!user) throw new NotFoundException('User not found!');
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          resetToken: hashedToken,
          resetTokenExp: new Date(Date.now() + 1000 * 60 * 15),
        },
      });
      return user;
    });
    const resetUrl = `${req.protocol}://${req.get('host')}/rt=${resetToken}&uid=${user.id}`;
    await this.mailer.passwordResetEmail(user.email, user.name, resetUrl);
    return { message: 'Reset email sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: dto.userId,
          status: true,
          isDeleted: false,
        },
        select: {
          resetToken: true,
          resetTokenExp: true,
          id: true,
        },
      });
      if (!user || !user.resetToken || !user.resetTokenExp) {
        throw new UnauthorizedException('User not found!');
      }
      const isMatched = await Util.match(user.resetToken, dto.refreshToken);
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
          password: await Util.hash(dto.newPassword),
          resetToken: null,
          resetTokenExp: null,
        },
      });
    });
    return { message: 'Password successfully reset' };
  }

  async changePassword(dto: ChangePasswordDto) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          status: true,
          isDeleted: false,
          id: dto.userId,
        },
        select: {
          id: true,
          password: true,
        },
      });
      if (!user) throw new NotFoundException('No user found!');
      const isMatched = await Util.match(user.password, dto.oldPassword);
      if (!isMatched) throw new ForbiddenException('Old Password is wrong');
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: await Util.hash(dto.newPassword),
        },
      });
    });
    return { message: 'Password changed!' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        refreshToken: true,
        id: true,
        email: true,
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
      select: {
        refreshToken: true,
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
        refreshToken: null,
      },
    });
  }
}
