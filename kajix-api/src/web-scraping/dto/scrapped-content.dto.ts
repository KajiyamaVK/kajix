import { ApiProperty } from '@nestjs/swagger';

export class ScrappedContentDto {
  @ApiProperty({
    description: 'Unique identifier of the scrapped content',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Base URL from where the scraping started',
    example: 'https://example.com',
  })
  baseUrl: string;

  @ApiProperty({
    description: 'URL that was actually scrapped',
    example: 'https://example.com/page',
  })
  scrappedUrl: string;

  @ApiProperty({
    description: 'When the content was last scrapped',
    example: '2023-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  lastScrappedAt: Date;

  @ApiProperty({
    description: 'The HTML content that was scrapped',
    example: '<html><body><p>Example content</p></body></html>',
  })
  htmlContent: string;

  @ApiProperty({
    description: 'The markdown version of the HTML content',
    example: '# Example content',
    nullable: true,
  })
  markdownContent?: string;

  @ApiProperty({
    description: 'When the record was created',
    example: '2023-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the record was last updated',
    example: '2023-01-01T12:00:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
