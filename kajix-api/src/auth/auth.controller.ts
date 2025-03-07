// Testing Husky pre-push hook - Backend
import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

class LoginDto {
  email: string;
  password: string;
}

class RefreshTokenDto {
  refresh_token: string;
}

interface UserRequest extends ExpressRequest {
  user: {
    userId: number;
    accessToken: string;
  };
  body: {
    refresh_token: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Request() req: UserRequest) {
    const { userId, accessToken } = req.user;
    const refreshToken = req.body.refresh_token;
    return this.authService.logout(userId, accessToken, refreshToken);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}
