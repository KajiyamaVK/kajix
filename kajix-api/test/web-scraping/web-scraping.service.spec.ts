import { Test, TestingModule } from '@nestjs/testing';
import { WebScrapingService } from '../../src/web-scraping/web-scraping.service';
import {
  BadRequestException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { chromium } from 'playwright';
import { PrismaService } from '../../src/prisma/prisma.service';
import { HtmlMarkdownService } from '../../src/html-markdown/html-markdown.service';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('WebScrapingService', () => {
  let service: WebScrapingService;
  let mockPage: any;
  let mockBrowser: any;

  beforeEach(async () => {
    // Create mock browser and page
    mockPage = {
      goto: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebScrapingService],
    }).compile();

    service = module.get<WebScrapingService>(WebScrapingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scrapeLinks', () => {
    it('should successfully extract content from main page and linked pages', async () => {
      // Mock successful page navigation
      mockPage.goto.mockResolvedValue(undefined);

      // Mock link extraction for main page
      mockPage.evaluate
        .mockResolvedValueOnce([
          { url: 'https://example.com/page1', text: 'Page 1' },
          { url: 'https://external.com', text: 'External Link' },
        ])
        .mockResolvedValueOnce({
          title: 'Main Page',
          description: 'Main page description',
          text: 'Main content text',
          html: '<html><body>Main content</body></html>',
        })
        // Mock content for first linked page
        .mockResolvedValueOnce({
          title: 'Page 1',
          description: 'Page 1 description',
          text: 'Page 1 content',
          html: '<html><body>Page 1 content</body></html>',
        })
        // Mock content for second linked page
        .mockResolvedValueOnce({
          title: 'External Page',
          description: 'External page description',
          text: 'External content',
          html: '<html><body>External content</body></html>',
        });

      const result = await service.scrapeLinks({ url: 'https://example.com' });

      // Verify browser interaction
      expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(3); // Main page + 2 linked pages
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ waitUntil: 'domcontentloaded' }),
      );

      // Verify result structure
      expect(result).toHaveProperty('sourceUrl', 'https://example.com');
      expect(result).toHaveProperty('content');
      expect(result.content).toHaveLength(3); // Main page + 2 linked pages
      expect(result).toHaveProperty('scrapedAt');

      // Verify main page content
      expect(result.content[0]).toEqual({
        url: 'https://example.com',
        isExternal: false,
        title: 'Main Page',
        description: 'Main page description',
        text: 'Main content text',
        html: '<html><body>Main content</body></html>',
      });

      // Verify linked pages content
      expect(result.content[1]).toEqual({
        url: 'https://example.com/page1',
        isExternal: false,
        title: 'Page 1',
        description: 'Page 1 description',
        text: 'Page 1 content',
        html: '<html><body>Page 1 content</body></html>',
      });

      expect(result.content[2]).toEqual({
        url: 'https://external.com',
        isExternal: true,
        title: 'External Page',
        description: 'External page description',
        text: 'External content',
        html: '<html><body>External content</body></html>',
      });

      // Verify cleanup
      expect(mockPage.close).toHaveBeenCalledTimes(3); // Once for each page
    });

    it('should handle failed scraping of linked pages', async () => {
      // Mock successful page navigation for main page
      mockPage.goto
        .mockResolvedValueOnce(undefined)
        // Mock failed navigation for linked page
        .mockRejectedValueOnce(new Error('Failed to load'));

      // Mock link extraction and content
      mockPage.evaluate
        .mockResolvedValueOnce([
          { url: 'https://example.com/page1', text: 'Page 1' },
        ])
        .mockResolvedValueOnce({
          title: 'Main Page',
          description: 'Main page description',
          text: 'Main content text',
          html: '<html><body>Main content</body></html>',
        });

      const result = await service.scrapeLinks({ url: 'https://example.com' });

      // Should still have main page content
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        url: 'https://example.com',
        isExternal: false,
        title: 'Main Page',
        description: 'Main page description',
        text: 'Main content text',
        html: '<html><body>Main content</body></html>',
      });
    });

    it('should throw RequestTimeoutException on main page navigation timeout', async () => {
      // Mock timeout error
      const timeoutError = new Error('Navigation timeout');
      timeoutError.name = 'TimeoutError';
      mockPage.goto.mockRejectedValue(timeoutError);

      await expect(
        service.scrapeLinks({ url: 'https://example.com' }),
      ).rejects.toThrow(RequestTimeoutException);

      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should throw BadRequestException on main page navigation error', async () => {
      // Mock generic error
      mockPage.goto.mockRejectedValue(new Error('Connection refused'));

      await expect(
        service.scrapeLinks({ url: 'https://example.com' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should handle invalid URLs in extracted links', async () => {
      mockPage.goto.mockResolvedValue(undefined);

      // Mock link extraction and content
      mockPage.evaluate
        .mockResolvedValueOnce([
          { url: 'https://example.com/page1', text: 'Page 1' },
          { url: ':::invalid:::', text: 'Invalid URL' },
        ])
        .mockResolvedValueOnce({
          title: 'Main Page',
          description: 'Main page description',
          text: 'Main content text',
          html: '<html><body>Main content</body></html>',
        })
        .mockResolvedValueOnce({
          title: 'Page 1',
          description: 'Page 1 description',
          text: 'Page 1 content',
          html: '<html><body>Page 1 content</body></html>',
        });

      const result = await service.scrapeLinks({ url: 'https://example.com' });

      // Should have main page and one valid linked page
      expect(result.content).toHaveLength(2);
      expect(result.content[0].url).toBe('https://example.com');
      expect(result.content[1].url).toBe('https://example.com/page1');
    });
  });

  describe('onModuleDestroy', () => {
    it('should close the browser when module is destroyed', async () => {
      // First call a method to initialize the browser
      mockPage.evaluate.mockResolvedValueOnce([]).mockResolvedValueOnce({
        title: null,
        description: null,
        text: '',
        html: '',
      });
      mockPage.goto.mockResolvedValue(undefined);
      await service.scrapeLinks({ url: 'https://example.com' });

      // Then test onModuleDestroy
      await service.onModuleDestroy();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});

// Add upsert functionality tests with complete service dependencies
describe('WebScrapingService - Upsert Functionality', () => {
  let service: WebScrapingService;
  let prismaService: any;
  let htmlMarkdownService: any;
  let mockPage: any;
  let mockBrowser: any;

  // Mock data
  const baseUrl = 'https://example.com';
  const scrappedUrl = 'https://example.com/page1';
  const htmlContent = '<html><body><h1>Test Content</h1></body></html>';
  const markdownContent = '# Test Content';

  // First scrape timestamp
  const firstScrapeDate = new Date('2023-01-01T10:00:00Z');

  // Later scrape timestamp
  const secondScrapeDate = new Date('2023-01-02T10:00:00Z');

  beforeEach(async () => {
    // Create mock services
    const mockPrismaService = {
      scrappedContent: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const mockHtmlMarkdownService = {
      convertHtmlToMarkdown: jest.fn().mockResolvedValue({
        markdown: markdownContent,
      }),
    };

    // Create mock browser and page
    mockPage = {
      goto: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    // Disable logger in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebScrapingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HtmlMarkdownService,
          useValue: mockHtmlMarkdownService,
        },
      ],
    }).compile();

    service = module.get<WebScrapingService>(WebScrapingService);
    prismaService = module.get(PrismaService);
    htmlMarkdownService = module.get(HtmlMarkdownService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update existing content when scraping a URL that has already been scraped', async () => {
    // Mock the success page navigation and evaluation
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.evaluate
      .mockResolvedValueOnce([]) // No links
      .mockResolvedValueOnce({
        title: 'Test Page',
        description: 'Test description',
        text: 'Test content',
        html: htmlContent,
      });

    // First time scrape - mock upsert creating a new record
    prismaService.scrappedContent.upsert.mockResolvedValueOnce({
      id: 'test-id-1',
      baseUrl,
      scrappedUrl,
      htmlContent,
      markdownContent,
      lastScrappedAt: firstScrapeDate,
      createdAt: firstScrapeDate,
      updatedAt: firstScrapeDate,
    });

    // Second time scrape - mock upsert updating existing record
    prismaService.scrappedContent.upsert.mockResolvedValueOnce({
      id: 'test-id-1',
      baseUrl,
      scrappedUrl,
      htmlContent,
      markdownContent,
      lastScrappedAt: secondScrapeDate, // Notice this is updated
      createdAt: firstScrapeDate, // This remains the same
      updatedAt: secondScrapeDate, // This is updated
    });

    // Make the first scrape request
    await service.scrapeLinks({ url: baseUrl });

    // Verify first upsert call - should create a new record
    expect(prismaService.scrappedContent.upsert).toHaveBeenCalledWith({
      where: { scrappedUrl: baseUrl },
      update: expect.objectContaining({
        baseUrl,
        scrappedUrl: baseUrl,
        htmlContent,
        lastScrappedAt: expect.any(Date),
      }),
      create: expect.objectContaining({
        baseUrl,
        scrappedUrl: baseUrl,
        htmlContent,
        lastScrappedAt: expect.any(Date),
      }),
    });

    // Clear upsert mock to check second call
    prismaService.scrappedContent.upsert.mockClear();

    // Make the second scrape request to the same URL
    await service.scrapeLinks({ url: baseUrl });

    // Verify second upsert call - should update the existing record
    expect(prismaService.scrappedContent.upsert).toHaveBeenCalledWith({
      where: { scrappedUrl: baseUrl },
      update: expect.objectContaining({
        baseUrl,
        scrappedUrl: baseUrl,
        htmlContent,
        lastScrappedAt: expect.any(Date),
      }),
      create: expect.objectContaining({
        baseUrl,
        scrappedUrl: baseUrl,
        htmlContent,
        lastScrappedAt: expect.any(Date),
      }),
    });
  });

  it('should include markdown content in the response when scraping a page', async () => {
    // Mock the success page navigation and evaluation
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.evaluate
      .mockResolvedValueOnce([]) // No links
      .mockResolvedValueOnce({
        title: 'Test Page',
        description: 'Test description',
        text: 'Test content',
        html: htmlContent,
      });

    // Mock upsert creating a new record
    prismaService.scrappedContent.upsert.mockResolvedValueOnce({
      id: 'test-id-1',
      baseUrl,
      scrappedUrl: baseUrl,
      htmlContent,
      markdownContent,
      lastScrappedAt: firstScrapeDate,
      createdAt: firstScrapeDate,
      updatedAt: firstScrapeDate,
    });

    // Make the scrape request
    const result = await service.scrapeLinks({ url: baseUrl });

    // Verify the response includes the markdown
    expect(result.content[0]).toHaveProperty('html', htmlContent);
    expect(result.content[0]).toHaveProperty('markdown', markdownContent);
  });
});
