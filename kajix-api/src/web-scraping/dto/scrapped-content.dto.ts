import { ApiProperty } from '@nestjs/swagger';

export class ScrappedContentDto {
  @ApiProperty({ description: 'Unique identifier of the scrapped content' })
  id: string;

  @ApiProperty({ description: 'Base URL from where the scraping started' })
  baseUrl: string;

  @ApiProperty({ description: 'URL that was actually scrapped' })
  scrappedUrl: string;

  @ApiProperty({ description: 'When the content was last scrapped' })
  lastScrappedAt: Date;

  @ApiProperty({ description: 'The HTML content that was scrapped' })
  htmlContent: string;

  @ApiProperty({ description: 'The markdown version of the HTML content' })
  markdownContent?: string;

  @ApiProperty({ description: 'When the record was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt: Date;
}
