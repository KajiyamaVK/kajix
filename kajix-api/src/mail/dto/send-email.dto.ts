import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Email address of the recipient',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Subject of the email',
    example: 'Welcome to Kajix',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description:
      'HTML content of the email. Will be wrapped in the email layout.',
    example: '<div><h1>Welcome!</h1><p>Thank you for joining us.</p></div>',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  contentHtml: string;
}
