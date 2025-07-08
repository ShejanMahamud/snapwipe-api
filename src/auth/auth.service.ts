import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Util } from 'src/utils/utils';
import { registerDto } from './dto/register.dto';
import { signinDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signUp(dto: registerDto) {
    return this.prisma.user.create({
      data: {
        ...dto,
        profilePhoto: dto.profilePhoto
          ? dto.profilePhoto
          : `https://ui-avatars.com/api/?name=${dto.name}&background=random&color=fff`,
        password: await Util.hashPassword(dto.password),
      },
    });
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
    const isMatched = await Util.matchPassword(user.password, dto.password);
    if (!isMatched) {
      throw new UnauthorizedException('Credentials Invalid');
    }
  }
}
