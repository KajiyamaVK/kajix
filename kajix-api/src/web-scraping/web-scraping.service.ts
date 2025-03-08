import {
  Injectable,
  Logger,
  BadRequestException,
  RequestTimeoutException,
} from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import { ScrapingRequest, ScrapingResponse, PageContent } from '@types';
import {
  WEB_SCRAPING_TIMEOUT,
  USER_AGENT,
  MAX_LINKS_PER_PAGE,
} from './web-scraping.constants';

/**
 * Service for web scraping operations using Playwright
 */
@Injectable()
export class WebScrapingService {
  private readonly logger = new Logger(WebScrapingService.name);
  private browser: Browser | null = null;

  /**
   * Initialize browser if needed and return an instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  /**
   * Clean up browser resources when service is destroyed
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape content from a given URL and all its linked pages
   * @param request Scraping request with URL
   * @returns ScrapingResponse with content from all pages
   */
  async scrapeLinks(request: ScrapingRequest): Promise<ScrapingResponse> {
    this.logger.log(`Scraping content from ${request.url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage({
      userAgent: USER_AGENT,
    });

    try {
      // Navigate to the URL with timeout
      try {
        await page.goto(request.url, {
          timeout: WEB_SCRAPING_TIMEOUT,
          waitUntil: 'domcontentloaded',
        });
      } catch (error) {
        if (error.name === 'TimeoutError') {
          throw new RequestTimeoutException('Navigation timeout exceeded');
        }
        throw new BadRequestException(`Failed to load URL: ${error.message}`);
      }

      // Extract links and content from the main page
      let rawLinks;
      let mainContent;

      // Extract links first
      try {
        rawLinks = await this.extractLinks(page);
      } catch (error) {
        this.logger.error(`Failed to extract links: ${error.message}`);
        throw new BadRequestException(
          `Failed to extract links: ${error.message}`,
        );
      }

      // Then extract content
      try {
        mainContent = await this.extractContent(page);
      } catch (error) {
        this.logger.error(`Failed to extract content: ${error.message}`);
        throw new BadRequestException(
          `Failed to extract content: ${error.message}`,
        );
      }

      // Process links and create the content array
      const content: PageContent[] = await this.processContent(
        request.url,
        rawLinks,
        mainContent,
        browser,
      );

      return {
        sourceUrl: request.url,
        content,
        scrapedAt: new Date(),
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Extract all links from the page
   */
  private async extractLinks(
    page: Page,
  ): Promise<{ url: string; text: string | null }[]> {
    return page.evaluate((maxLinks: number) => {
      const links = document.querySelectorAll<HTMLAnchorElement>('a[href]');
      return Array.from(links)
        .slice(0, maxLinks)
        .map((anchor) => ({
          url: anchor.href,
          text: anchor.textContent?.trim() || null,
        }));
    }, MAX_LINKS_PER_PAGE);
  }

  /**
   * Extract content from the page
   */
  private async extractContent(
    page: Page,
  ): Promise<Omit<PageContent, 'url' | 'isExternal'>> {
    return page.evaluate(() => {
      // Get page title
      const title = document.title || null;

      // Get meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      const description = metaDescription?.getAttribute('content') || null;

      // Get main content text (excluding scripts, styles, etc.)
      const bodyClone = document.body.cloneNode(true) as HTMLElement;
      // Remove script and style elements
      bodyClone
        .querySelectorAll('script, style, noscript, iframe')
        .forEach((el) => el.remove());
      const text = bodyClone.textContent?.trim() || '';

      // Get HTML content
      const html = document.documentElement.outerHTML;

      return {
        title,
        description,
        text,
        html,
      };
    });
  }

  /**
   * Process links and content to create the final content array
   */
  private async processContent(
    baseUrl: string,
    rawLinks: { url: string; text: string | null }[],
    mainContent: Omit<PageContent, 'url' | 'isExternal'>,
    browser: Browser,
  ): Promise<PageContent[]> {
    try {
      const baseUrlObj = new URL(baseUrl);
      const content: PageContent[] = [];

      // Add main page content
      content.push({
        url: baseUrl,
        isExternal: false,
        ...mainContent,
      });

      // Process each link
      const validLinks = rawLinks
        .filter((link) => link.url.trim() !== '')
        .map((link) => {
          try {
            const fullUrl = new URL(link.url, baseUrl).href;
            return {
              url: fullUrl,
              isExternal: new URL(fullUrl).hostname !== baseUrlObj.hostname,
            };
          } catch (error) {
            this.logger.warn(`Skipping invalid URL: ${link.url}`);
            return null;
          }
        })
        .filter(
          (link): link is { url: string; isExternal: boolean } => link !== null,
        );

      // Scrape content for each valid link
      for (const link of validLinks) {
        try {
          const page = await browser.newPage({ userAgent: USER_AGENT });
          try {
            await page.goto(link.url, {
              timeout: WEB_SCRAPING_TIMEOUT,
              waitUntil: 'domcontentloaded',
            });
            const linkContent = await this.extractContent(page);
            content.push({
              url: link.url,
              isExternal: link.isExternal,
              ...linkContent,
            });
          } catch (error) {
            this.logger.warn(`Failed to scrape ${link.url}: ${error.message}`);
          } finally {
            await page.close();
          }
        } catch (error) {
          this.logger.warn(
            `Failed to create page for ${link.url}: ${error.message}`,
          );
        }
      }

      return content;
    } catch (error) {
      this.logger.error(`Error processing content: ${error.message}`);
      throw new BadRequestException('Error processing content');
    }
  }
}
