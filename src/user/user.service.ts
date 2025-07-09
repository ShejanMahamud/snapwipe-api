import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePhoto: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUser(limit?: number, cursor?: string) {
    const queryOptions: any = {
      take: limit ? limit : 10,
      select: userSelectFields,
      orderBy: {
        id: 'asc',
      },
    };

    if (cursor) {
      ((queryOptions.skip = 1),
        (queryOptions.cursor = {
          id: cursor,
        }));
    }
    return await this.prisma.user.findMany(queryOptions);
  }
  async getAUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: userSelectFields,
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    return user;
  }
}
