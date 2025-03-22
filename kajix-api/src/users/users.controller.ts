import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerificationResponseDto } from './dto/verification-response.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send email verification',
    description: 'Sends a verification email to the specified email address',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent successfully',
    type: VerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or invalid locale',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Mail sender configuration is missing or other internal error',
  })
  async sendVerificationEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<VerificationResponseDto> {
    return this.usersService.sendVerificationEmail(
      verifyEmailDto.email,
      verifyEmailDto.locale,
    );
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email token',
    description:
      'Validates the token received via email for email verification',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token validated successfully',
    type: VerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token is invalid, expired, or has already been used',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Token not found',
  })
  async verifyToken(
    @Body() verifyTokenDto: VerifyTokenDto,
  ): Promise<VerificationResponseDto> {
    return this.usersService.verifyToken(verifyTokenDto.token);
  }
}
