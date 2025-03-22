import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { Locale } from '@kajix/types';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email address to verify',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Preferred locale for the email content',
    enum: Locale,
    enumName: 'Locale',
  })
  @IsEnum(Locale, { message: 'Invalid locale. Must be either "en" or "ptbr"' })
  locale: Locale;
}
