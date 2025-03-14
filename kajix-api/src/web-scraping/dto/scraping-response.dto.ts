import { ScrapingResponse, PageContent } from '@types';
import { ApiProperty } from '@nestjs/swagger';
import { PageContentDto } from './page-content.dto';

/**
 * DTO for web scraping responses
 */
export class ScrapingResponseDto implements ScrapingResponse {
  /**
   * The source URL that was scraped
   */
  @ApiProperty({
    description: 'The source URL that was scraped',
    example: 'https://example.com',
  })
  sourceUrl: string;

  /**
   * Array of content from all scraped pages
   */
  @ApiProperty({
    description: 'Array of content from all scraped pages',
    type: PageContentDto,
    isArray: true,
  })
  content: PageContent[];

  /**
   * Timestamp when scraping was completed
   */
  @ApiProperty({
    description: 'Timestamp when scraping was completed',
    type: 'string',
    format: 'date-time',
  })
  scrapedAt: Date;
}
