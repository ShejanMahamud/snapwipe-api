import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string; email: string };

    const isAdmin = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
        role: 'admin',
      },
      select: {
        id: true,
      },
    });
    if (!isAdmin) {
      throw new UnauthorizedException('Admin has permission only!');
    }
    return true;
  }
}
