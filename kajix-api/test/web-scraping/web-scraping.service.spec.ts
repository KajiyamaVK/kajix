import { Test, TestingModule } from '@nestjs/testing';
import { WebScrapingService } from '../../src/web-scraping/web-scraping.service';
import { BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { chromium } from 'playwright';

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
