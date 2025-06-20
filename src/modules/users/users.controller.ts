import {
  Controller,
  Req,
  Get,
  Patch,
  Param,
  Post,
  Delete,
  Body,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { AuthRequest } from 'src/common/interfaces/authRequest.interface';
import { JwtAuthGuard } from 'src/common/guards/auth.guards';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.signupUser(createUserDto);
    return {
      message: 'User registered successfully',
      data: newUser,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthRequest,
  ) {
    const requester = req.user;
    if (requester.id !== id) {
      throw new ForbiddenException('You are not allowed to update this user');
    }
    const updatedUser = await this.userService.updateUser(id, updateUserDto);
    return {
      message: 'User successfully updated',
      data: updatedUser,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string, @Req() req: AuthRequest) {
    const requester = req.user;
    if (requester.id !== id) {
      throw new ForbiddenException('You are not allowed to delete this user');
    }
    const result = await this.userService.deleteUser(id);
    return {
      message: 'User successfully deleted',
      data: result,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: AuthRequest) {
    const userId = req.user.id;
    const user = await this.userService.getUserById(userId);
    return {
      message: 'User fetched successfully',
      data: user,
    };
  }
}