import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorators';
import { UserGuard } from 'src/common/guards/user.guard';
import { responseGenerator } from 'src/common/helpers/response-generator';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/user.service';

@ApiTags('Users')
@UseGuards(UserGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //------------------------------
  @Get('current-user')
  async currentUser(@CurrentUser() user: User) {
    const data = await this.usersService.userRoles(user.id);
    return responseGenerator({
      statusCode: 200,
      message: 'successful',
      data: { ...data, ...user },
    });
  }
}
