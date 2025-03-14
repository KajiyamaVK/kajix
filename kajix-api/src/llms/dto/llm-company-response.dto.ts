import { ApiProperty } from '@nestjs/swagger';

export class LLMCompanyResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the LLM company',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the LLM company',
    example: 'OpenAI',
  })
  companyName: string;

  @ApiProperty({
    description: 'Indicates if the LLM company is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation date of the LLM company record',
    example: '2023-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the LLM company record',
    example: '2023-01-15T12:00:00.000Z',
  })
  updatedAt: Date;
}
