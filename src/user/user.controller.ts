import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Util } from 'src/utils/utils';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}
  @Get('all')
  async getAllUsers(@Query() query: { limit: string; cursor: string }) {
    const take = parseInt(query.limit);
    const users = await this.user.getAllUser(take, query.cursor);

    if (query.limit || query.cursor) {
      return Util.success('User retrieved successfully!', users, {
        limit: query.limit,
        count: users.length,
        nextCursor: users.length > 0 ? users[users.length - 1].id : null,
        hasNextPage: users.length > take,
      });
    }
    return Util.success('User retrieved successfully!', users);
  }

  @Get(':id')
  async getAUser(@Param('id') id: string) {
    const user = await this.user.getAUser(id);
    return Util.success('User fetched successfully', user);
  }
}
