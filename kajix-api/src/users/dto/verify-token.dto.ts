import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTokenDto {
  @ApiProperty({
    description: 'The verification token received via email',
    example: 'abc123def456...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
