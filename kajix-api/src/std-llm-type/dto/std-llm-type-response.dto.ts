import { ApiProperty } from '@nestjs/swagger';

export class StdLlmTypeResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the LLM type',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The LLM type name',
    example: 'Embedding',
  })
  type: string;

  @ApiProperty({
    description: 'Whether the LLM type is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
