import { Test, TestingModule } from '@nestjs/testing';
import { WebScrapingService } from './web-scraping.service';
import { chromium, Browser, Page } from 'playwright';
import { BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { ScrapingRequest, ScrapingResponse } from '@types';
import { PrismaService } from '../prisma/prisma.service';
import { HtmlMarkdownService } from '../html-markdown/html-markdown.service';

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('WebScrapingService', () => {
  let service: WebScrapingService;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;
  let prisma: PrismaService;
  let htmlMarkdownService: HtmlMarkdownService;

  const mockScrappedContent = {
    id: 'test-id',
    baseUrl: 'https://example.com',
    scrappedUrl: 'https://example.com/page1',
    lastScrappedAt: new Date(),
    htmlContent: '<html><body><h1>Test</h1></body></html>',
    markdownContent: '# Test',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Reset mocks
    mockPage = {
      goto: jest.fn(),
      close: jest.fn(),
      evaluate: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    } as unknown as jest.Mocked<Browser>;

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebScrapingService,
        {
          provide: PrismaService,
          useValue: {
            scrappedContent: {
              create: jest.fn().mockResolvedValue(mockScrappedContent),
              findMany: jest.fn().mockResolvedValue([mockScrappedContent]),
              findUnique: jest.fn().mockResolvedValue(mockScrappedContent),
            },
          },
        },
        {
          provide: HtmlMarkdownService,
          useValue: {
            convertHtmlToMarkdown: jest.fn().mockResolvedValue({
              markdown: '# Test',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WebScrapingService>(WebScrapingService);
    prisma = module.get<PrismaService>(PrismaService);
    htmlMarkdownService = module.get<HtmlMarkdownService>(HtmlMarkdownService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('scrapeLinks', () => {
    const mockRequest: ScrapingRequest = {
      url: 'https://example.com',
    };

    const mockMainContent = {
      title: 'Example Title',
      description: 'Example Description',
      text: 'Example Text',
      html: '<html>Example HTML</html>',
    };

    const mockLinks = [{ url: 'https://example.com/page1', text: 'Page 1' }];

    beforeEach(() => {
      // Reset page-specific mocks
      mockPage.evaluate.mockReset();
      mockPage.goto.mockReset();

      // Mock successful navigation
      mockPage.goto.mockResolvedValue(null);

      // Mock page.evaluate for extractLinks and extractContent
      mockPage.evaluate.mockImplementation(
        (pageFunction: unknown, ...args: unknown[]) => {
          // If args are passed, it's the extractLinks function
          if (args.length > 0) {
            return Promise.resolve(mockLinks);
          }
          // Otherwise it's the extractContent function
          return Promise.resolve(mockMainContent);
        },
      );
    });

    it('should successfully scrape content from a URL and its links', async () => {
      const result = await service.scrapeLinks(mockRequest);

      expect(result).toBeDefined();
      expect(result.sourceUrl).toBe(mockRequest.url);
      expect(result.content).toHaveLength(2); // Main URL and one linked page
      expect(result.content[0]).toMatchObject({
        url: mockRequest.url,
        ...mockMainContent,
      });
      expect(result.content[1]).toMatchObject({
        url: 'https://example.com/page1',
        ...mockMainContent,
      });

      expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith(
        mockRequest.url,
        expect.any(Object),
      );
    });

    it('should handle navigation timeout', async () => {
      const mockRequest = { url: 'https://example.com' };
      const timeoutError = new Error('Navigation timeout');
      mockPage.goto.mockRejectedValue(timeoutError);

      await expect(service.scrapeLinks(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.scrapeLinks(mockRequest)).rejects.toThrow(
        'Navigation timeout',
      );
    });

    it('should handle invalid URLs', async () => {
      mockPage.goto.mockRejectedValue(new Error('Invalid URL'));

      await expect(service.scrapeLinks(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should clean up resources after scraping', async () => {
      await service.scrapeLinks(mockRequest);
      await service.onModuleDestroy();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should save scrapped content to database', async () => {
      await service.scrapeLinks(mockRequest);

      expect(htmlMarkdownService.convertHtmlToMarkdown).toHaveBeenCalledWith({
        html: expect.any(String),
      });
      expect(prisma.scrappedContent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          baseUrl: mockRequest.url,
          htmlContent: expect.any(String),
        }),
      });
    });

    it('should handle markdown conversion failure and continue scraping', async () => {
      // Mock the markdown conversion to fail
      (
        htmlMarkdownService.convertHtmlToMarkdown as jest.Mock
      ).mockRejectedValueOnce(new Error('Conversion failed'));

      // Mock successful page scraping
      const mockRequest = { url: 'https://example.com' };
      const mockHtml = '<html><body>Test content</body></html>';
      mockPage.evaluate.mockImplementation(
        (pageFunction: unknown, ...args: unknown[]) => {
          // If args are passed, it's the extractLinks function
          if (args.length > 0) {
            return Promise.resolve([]);
          }
          // Otherwise it's the extractContent function
          return Promise.resolve({
            title: 'Test Page',
            description: 'Test Description',
            text: 'Test content',
            html: mockHtml,
          });
        },
      );

      // Execute the scraping
      const result = await service.scrapeLinks(mockRequest);

      // Verify the result
      expect(result).toBeDefined();
      expect(result.sourceUrl).toBe(mockRequest.url);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        url: mockRequest.url,
        isExternal: false,
        title: 'Test Page',
        description: 'Test Description',
        text: 'Test content',
        html: mockHtml,
      });

      // Verify that the content was saved to the database
      expect(prisma.scrappedContent.create).toHaveBeenCalledWith({
        data: {
          baseUrl: mockRequest.url,
          scrappedUrl: mockRequest.url,
          htmlContent: mockHtml,
          markdownContent: undefined,
        },
      });
    });
  });
});
