import { ScrapingResponse, PageContent } from '@types';

/**
 * DTO for web scraping responses
 */
export class ScrapingResponseDto implements ScrapingResponse {
  /**
   * The source URL that was scraped
   */
  sourceUrl: string;

  /**
   * Array of content from all scraped pages
   */
  content: PageContent[];

  /**
   * Timestamp when scraping was completed
   */
  scrapedAt: Date;
}
