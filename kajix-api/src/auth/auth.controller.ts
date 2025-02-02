// Testing Husky pre-push hook - Backend
import { Controller, Post, Body, Req, Headers, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto.email, loginDto.password, req);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Headers('session-token') sessionToken: string) {
    return this.authService.logout(sessionToken);
  }

  @Post('validate-session')
  @HttpCode(200)
  async validateSession(@Headers('session-token') sessionToken: string) {
    return this.authService.validateSession(sessionToken);
  }
} 