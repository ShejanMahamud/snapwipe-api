import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/guard/AdminGuard';
import { Util } from 'src/utils/utils';
import { UpdateUserDto } from './dto/update.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}

  @Get('all')
  @UseGuards(AdminGuard)
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
  @UseGuards(AuthGuard('jwt'))
  async getAUser(@Param('id') id: string) {
    const user = await this.user.getAUser(id);
    return Util.success('User fetched successfully', user);
  }

  @Post('update/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(@Body() dto: UpdateUserDto, @Param('id') id: string) {
    await this.user.updateUser(dto, id);
    return Util.success('User updated successfully!');
  }
}
