import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Util } from 'src/utils/utils';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          req?.cookies?.refresh_token || req?.body?.refresh_token,
      ]),
      secretOrKey: config.get('REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }
  async validate(req: Request, payload: { sub: string; email: string }) {
    const token = req?.cookies?.refresh_token || req?.body?.refresh_token;

    if (!token) {
      throw new ForbiddenException('Refresh Token Required!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Refresh Token not Found!');
    }
    const isMatched = await Util.match(user.refreshToken, token);
    if (!isMatched)
      throw new UnauthorizedException('Refresh Token is not valid');
    return payload;
  }
}
