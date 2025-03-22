import { ApiProperty } from '@nestjs/swagger';

export class VerificationResponseDto {
  @ApiProperty({
    description: 'Response message indicating the result of the verification',
    example: 'Token validated successfully',
    required: true,
  })
  message: string;
}
