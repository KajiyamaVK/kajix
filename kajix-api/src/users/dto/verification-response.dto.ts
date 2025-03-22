import { ApiProperty } from '@nestjs/swagger';

export class VerificationResponseDto {
  @ApiProperty({
    description:
      'Status message indicating the result of the verification email request',
    example: 'Verification email sent successfully',
  })
  message: string;
}
