import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUser(limit?: number, cursor?: string) {
    const queryOptions: any = {
      take: limit ? limit : 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePhoto: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
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
}
