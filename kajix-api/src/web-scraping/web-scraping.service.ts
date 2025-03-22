import {
  Injectable,
  Logger,
  BadRequestException,
  RequestTimeoutException,
} from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import { ScrapingRequest, ScrapingResponse, PageContent } from '@kajix/types';
import {
  WEB_SCRAPING_TIMEOUT,
  USER_AGENT,
  MAX_LINKS_PER_PAGE,
} from './web-scraping.constants';
import { PrismaService } from '../prisma/prisma.service';
import { HtmlMarkdownService } from '../html-markdown/html-markdown.service';
import { ScrappedContentDto } from './dto/scrapped-content.dto';

/**
 * Service for web scraping operations using Playwright
 */
@Injectable()
export class WebScrapingService {
  private readonly logger = new Logger(WebScrapingService.name);
  private browser: Browser | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly htmlMarkdownService: HtmlMarkdownService,
  ) {}

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
   * Save scrapped content to database and convert to markdown
   */
  private async saveScrappedContent(
    baseUrl: string,
    scrappedUrl: string,
    htmlContent: string,
  ): Promise<ScrappedContentDto> {
    let markdown: string | undefined;

    try {
      // Convert HTML to Markdown
      const result = await this.htmlMarkdownService.convertHtmlToMarkdown({
        html: htmlContent,
      });
      markdown = result.markdown;
    } catch (error) {
      this.logger.warn(`Failed to convert HTML to Markdown: ${error.message}`);
      markdown = undefined;
    }

    // Save to database
    const saved = await this.prisma.scrappedContent.create({
      data: {
        baseUrl,
        scrappedUrl,
        htmlContent,
        markdownContent: markdown || undefined, // Convert null to undefined
      },
    });

    return {
      ...saved,
      markdownContent: saved.markdownContent || undefined, // Convert null to undefined
    };
  }

  /**
   * Scrape a single page and extract its content
   */
  private async scrapePage(
    page: Page,
    url: string,
    visitedUrls: Set<string>,
    scrapedPages: PageContent[],
  ): Promise<void> {
    if (visitedUrls.has(url)) {
      return;
    }

    visitedUrls.add(url);

    try {
      await page.goto(url, {
        timeout: WEB_SCRAPING_TIMEOUT,
        waitUntil: 'domcontentloaded',
      });

      const content = await this.extractContent(page);
      scrapedPages.push({
        url,
        ...content,
        html: content.html,
        isExternal: false,
      });

      // Extract and process links
      const rawLinks = await this.extractLinks(page);
      const baseUrlObj = new URL(url);

      for (const link of rawLinks) {
        try {
          const fullUrl = new URL(link.url, url).href;
          if (
            !visitedUrls.has(fullUrl) &&
            new URL(fullUrl).hostname === baseUrlObj.hostname
          ) {
            await this.scrapePage(page, fullUrl, visitedUrls, scrapedPages);
          }
        } catch (error) {
          this.logger.warn(`Invalid URL ${link.url}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scrape ${url}: ${error.message}`);

      // Handle specific error types
      if (error.name === 'TimeoutError') {
        throw new RequestTimeoutException(`Navigation timeout for ${url}`);
      }

      // Handle navigation errors
      if (error.name === 'NavigationError') {
        throw new BadRequestException(
          `Failed to navigate to ${url}: ${error.message}`,
        );
      }

      // For other errors, preserve the original error message
      throw new BadRequestException(
        `Failed to scrape ${url}: ${error.message}`,
      );
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
    const page = await browser.newPage();
    const visitedUrls = new Set<string>();
    const scrapedPages: PageContent[] = [];

    try {
      await this.scrapePage(page, request.url, visitedUrls, scrapedPages);

      // Save all scrapped pages and add markdown content
      for (let i = 0; i < scrapedPages.length; i++) {
        const scrapedPage = scrapedPages[i];

        // Convert HTML to markdown
        try {
          const result = await this.htmlMarkdownService.convertHtmlToMarkdown({
            html: scrapedPage.html,
          });

          // Update the scraped page with markdown
          scrapedPages[i] = {
            ...scrapedPage,
            markdown: result.markdown,
          };

          // Save to database
          await this.saveScrappedContent(
            request.url, // base URL
            scrapedPage.url,
            scrapedPage.html,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to convert HTML to Markdown: ${error.message}`,
          );
          // Continue with other pages even if conversion fails
        }
      }

      return {
        sourceUrl: request.url,
        content: scrapedPages,
        scrapedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
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
