// Testing Husky pre-push hook - Backend
import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Request,
  UnauthorizedException,
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
    id: number;
    email: string;
  };
  body: {
    refresh_token: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(201)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Request() req: UserRequest) {
    const { id } = req.user;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];
    const refreshToken = req.body.refresh_token;

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Missing tokens');
    }

    return this.authService.logout(id, accessToken, refreshToken);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      // Extract user ID from the refresh token
      const decodedToken = this.authService['jwtService'].decode(
        refreshTokenDto.refresh_token,
      );
      if (!decodedToken?.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.authService.refreshToken(
        decodedToken.sub,
        refreshTokenDto.refresh_token,
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
