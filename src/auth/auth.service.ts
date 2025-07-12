import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { userSelectFields } from 'src/user/user.service';
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
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()[\]{}<>|\\/~`+=._-])[A-Za-z\d@$!%*?&#^()[\]{}<>|\\/~`+=._-]{8,}$/;
    if (!strongPasswordRegex.test(dto.password)) {
      throw new BadRequestException(
        'Password must be contains At least one lowercase letter,At least one uppercase letter, At least one number, At least one special character & At least one special character',
      );
    }
    const verifyToken = Util.generateToken();
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        profilePhoto: dto.profilePhoto
          ? dto.profilePhoto
          : `https://ui-avatars.com/api/?name=${dto.name}&background=random&color=fff`,
        password: await Util.hash(dto.password),
        verifyToken: await Util.hash(verifyToken),
        verifyTokenExp: new Date(Date.now() + 1000 * 60 * 15),
      },
    });
    await this.mailer.sendWelcomeEmail(
      dto.email,
      dto.name,
      `${req.protocol}://${req.get('host')}`,
    );
    await this.mailer.sendVerifyEmail(
      dto.email,
      dto.name,
      `${req.protocol}://${req.get('host')}/vt=${verifyToken}&uid=${user.id}`,
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
        status: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.status) {
      throw new ForbiddenException('Email must be verified!');
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
    const resetToken = Util.generateToken();
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

  async me(req: Request) {
    const user = req.user as { sub: string; email: string };
    if (!user) throw new UnauthorizedException('Unauthorized Request!');
    const isExists = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
        isDeleted: false,
        status: true,
      },
      select: userSelectFields,
    });
    if (!isExists) {
      throw new ForbiddenException('User not found!');
    }
    return isExists;
  }

  async resendVerifyEmail(email: string, req: Request) {
    const verifyToken = Util.generateToken();
    const user = await this.prisma.user.findUnique({
      where: {
        email,
        isDeleted: false,
        status: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verifyToken: await Util.hash(verifyToken),
        verifyTokenExp: new Date(Date.now() + 1000 * 60 * 15),
      },
    });
    await this.mailer.sendVerifyEmail(
      user.email,
      user.name,
      `${req.protocol}://${req.get('host')}/vt=${verifyToken}&uid=${user.id}`,
    );
    return { message: 'Email resend successfully!' };
  }

  async verifyEmail(verifyToken: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        verifyToken: true,
        verifyTokenExp: true,
      },
    });
    if (!user || !user.verifyToken || !user.verifyTokenExp) {
      throw new NotFoundException('User not found');
    }
    const isMatched = await Util.match(user.verifyToken, verifyToken);
    if (!isMatched) {
      throw new ForbiddenException('Token is not valid');
    }
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        status: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });
    return { message: 'Email verified!' };
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
    try {
      await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('REFRESH_TOKEN_SECRET'),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new ForbiddenException('Refresh token has expired');
        }

        if (error.name === 'JsonWebTokenError') {
          throw new ForbiddenException('Invalid refresh token');
        }

        throw new ForbiddenException(error.message);
      }

      throw new ForbiddenException('Unknown token verification error');
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

  async logOut(req: Request) {
    const userPayload = req.user as { sub: string; email: string };
    if (!userPayload) {
      throw new UnauthorizedException('User not logged in');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userPayload.sub,
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
        id: userPayload.sub,
      },
      data: {
        refreshToken: null,
      },
    });
  }
}
