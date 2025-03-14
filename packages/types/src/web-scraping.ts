/**
 * Web Scraping related types
 */

/**
 * Request payload for web scraping
 */
export interface ScrapingRequest {
  /**
   * URL to scrape
   */
  url: string;
}

/**
 * Represents a link found during scraping
 */
export interface Link {
  /**
   * The URL of the link
   */
  url: string;

  /**
   * The text content of the link
   */
  text: string | null;
}

/**
 * Represents a scraped page content including its URL and content
 */
export interface PageContent {
  /**
   * The URL of the page
   */
  url: string;

  /**
   * Whether the URL points to an external domain
   */
  isExternal: boolean;

  /**
   * The page title
   */
  title: string | null;

  /**
   * The page description (meta description)
   */
  description: string | null;

  /**
   * The main text content of the page
   */
  text: string;

  /**
   * HTML content of the page
   */
  html: string;

  /**
   * Markdown version of the HTML content
   */
  markdown?: string;
}

/**
 * Response from the web scraping service
 */
export interface ScrapingResponse {
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
