import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}
  @Get('all')
  getAllUsers(): string {
    return this.user.getAllUsers();
  }
}
