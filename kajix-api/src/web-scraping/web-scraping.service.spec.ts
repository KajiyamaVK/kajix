import { Test, TestingModule } from '@nestjs/testing';
import { WebScrapingService } from './web-scraping.service';
import { chromium, Browser, Page } from 'playwright';
import { BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { ScrapingRequest } from '@types';

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('WebScrapingService', () => {
  let service: WebScrapingService;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;
  let mockLinkedPage1: jest.Mocked<Page>;
  let mockLinkedPage2: jest.Mocked<Page>;

  beforeEach(async () => {
    // Reset mocks
    mockPage = {
      goto: jest.fn(),
      close: jest.fn(),
      evaluate: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    mockLinkedPage1 = {
      goto: jest.fn(),
      close: jest.fn(),
      evaluate: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    mockLinkedPage2 = {
      goto: jest.fn(),
      close: jest.fn(),
      evaluate: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    mockBrowser = {
      newPage: jest
        .fn()
        .mockResolvedValueOnce(mockPage)
        .mockResolvedValueOnce(mockLinkedPage1)
        .mockResolvedValueOnce(mockLinkedPage2),
      close: jest.fn(),
    } as unknown as jest.Mocked<Browser>;

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebScrapingService],
    }).compile();

    service = module.get<WebScrapingService>(WebScrapingService);
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

    const mockLinks = [
      { url: 'https://example.com/page1', text: 'Page 1' },
      { url: 'https://external.com', text: 'External Link' },
    ];

    beforeEach(() => {
      // Reset page-specific mocks
      mockPage.evaluate.mockReset();
      mockPage.goto.mockReset();
      mockLinkedPage1.evaluate.mockReset();
      mockLinkedPage1.goto.mockReset();
      mockLinkedPage2.evaluate.mockReset();
      mockLinkedPage2.goto.mockReset();

      // Mock page.evaluate for main page
      mockPage.evaluate
        .mockResolvedValueOnce(mockLinks) // First call for extractLinks
        .mockResolvedValueOnce(mockMainContent); // Second call for extractContent

      // Mock page.evaluate for linked pages
      mockLinkedPage1.evaluate.mockResolvedValueOnce(mockMainContent); // extractContent for first linked page

      mockLinkedPage2.evaluate.mockResolvedValueOnce(mockMainContent); // extractContent for second linked page

      // Mock successful navigation for all pages
      mockPage.goto.mockResolvedValue(null);
      mockLinkedPage1.goto.mockResolvedValue(null);
      mockLinkedPage2.goto.mockResolvedValue(null);
    });

    it('should successfully scrape content from a URL and its links', async () => {
      const result = await service.scrapeLinks(mockRequest);

      expect(result).toEqual({
        sourceUrl: mockRequest.url,
        content: [
          {
            url: mockRequest.url,
            isExternal: false,
            ...mockMainContent,
          },
          {
            url: 'https://example.com/page1',
            isExternal: false,
            ...mockMainContent,
          },
          {
            url: 'https://external.com/',
            isExternal: true,
            ...mockMainContent,
          },
        ],
        scrapedAt: expect.any(Date),
      });

      expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(3);
      expect(mockPage.goto).toHaveBeenCalledWith(
        mockRequest.url,
        expect.any(Object),
      );
    });

    it('should handle navigation timeout', async () => {
      mockPage.evaluate.mockReset();
      mockPage.goto.mockReset();

      const timeoutError = new Error('Navigation timeout');
      timeoutError.name = 'TimeoutError';
      mockPage.goto.mockRejectedValue(timeoutError);

      await expect(service.scrapeLinks(mockRequest)).rejects.toThrow(
        RequestTimeoutException,
      );
    });

    it('should handle invalid URLs', async () => {
      mockPage.evaluate.mockReset();
      mockPage.goto.mockReset();

      mockPage.goto.mockRejectedValue(new Error('Invalid URL'));

      await expect(service.scrapeLinks(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle failed content extraction', async () => {
      mockPage.evaluate.mockReset();
      mockPage.goto.mockReset();

      mockPage.goto.mockResolvedValue(null);
      mockPage.evaluate.mockRejectedValueOnce(
        new Error('Failed to extract links'),
      );

      await expect(service.scrapeLinks(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should clean up resources after scraping', async () => {
      mockPage.evaluate.mockReset();
      mockPage.goto.mockReset();

      mockPage.goto.mockResolvedValue(null);
      mockPage.evaluate
        .mockResolvedValueOnce(mockLinks)
        .mockResolvedValueOnce(mockMainContent);

      await service.scrapeLinks(mockRequest);
      await service.onModuleDestroy();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
