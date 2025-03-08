import { Test, TestingModule } from '@nestjs/testing';
import { WebScrapingController } from './web-scraping.controller';
import { WebScrapingService } from './web-scraping.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from './dto/content-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('WebScrapingController', () => {
  let controller: WebScrapingController;
  let service: WebScrapingService;
  let prisma: PrismaService;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebScrapingController],
      providers: [
        {
          provide: WebScrapingService,
          useValue: {
            scrapeLinks: jest.fn().mockResolvedValue({
              sourceUrl: 'https://example.com',
              content: [mockScrappedContent],
              scrapedAt: new Date(),
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            scrappedContent: {
              findMany: jest.fn().mockResolvedValue([mockScrappedContent]),
              findUnique: jest.fn().mockResolvedValue(mockScrappedContent),
              count: jest.fn().mockResolvedValue(1),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<WebScrapingController>(WebScrapingController);
    service = module.get<WebScrapingService>(WebScrapingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('scrapeLinks', () => {
    it('should scrape and return content', async () => {
      const result = await controller.scrapeLinks({
        url: 'https://example.com',
      });

      expect(result).toBeDefined();
      expect(result.sourceUrl).toBe('https://example.com');
      expect(service.scrapeLinks).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });
  });

  describe('getAllContent', () => {
    it('should return markdown content by default', async () => {
      const result = await controller.getAllContent();

      expect(result).toBeDefined();
      expect(result.data[0].markdownContent).toBeDefined();
      expect(result.data[0].htmlContent).toBeUndefined();
    });

    it('should return only HTML content when requested', async () => {
      const result = await controller.getAllContent(
        undefined,
        1,
        10,
        ContentType.HTML,
      );

      expect(result).toBeDefined();
      expect(result.data[0].htmlContent).toBeDefined();
      expect(result.data[0].markdownContent).toBeUndefined();
    });

    it('should return both HTML and markdown content when requested', async () => {
      const result = await controller.getAllContent(
        undefined,
        1,
        10,
        ContentType.BOTH,
      );

      expect(result).toBeDefined();
      expect(result.data[0].htmlContent).toBeDefined();
      expect(result.data[0].markdownContent).toBeDefined();
    });

    it('should filter by baseUrl when provided', async () => {
      const baseUrl = 'https://example.com';
      await controller.getAllContent(baseUrl);

      expect(prisma.scrappedContent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { baseUrl },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const page = 2;
      const pageSize = 20;
      await controller.getAllContent(undefined, page, pageSize);

      expect(prisma.scrappedContent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      );
    });
  });

  describe('getContentById', () => {
    it('should return markdown content by default', async () => {
      const result = await controller.getContentById('test-id');

      expect(result).toBeDefined();
      expect(result.markdownContent).toBeDefined();
      expect(result.htmlContent).toBeUndefined();
    });

    it('should return only HTML content when requested', async () => {
      const result = await controller.getContentById(
        'test-id',
        ContentType.HTML,
      );

      expect(result).toBeDefined();
      expect(result.htmlContent).toBeDefined();
      expect(result.markdownContent).toBeUndefined();
    });

    it('should return both HTML and markdown content when requested', async () => {
      const result = await controller.getContentById(
        'test-id',
        ContentType.BOTH,
      );

      expect(result).toBeDefined();
      expect(result.htmlContent).toBeDefined();
      expect(result.markdownContent).toBeDefined();
    });

    it('should throw BadRequestException when content not found', async () => {
      jest
        .spyOn(prisma.scrappedContent, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(controller.getContentById('non-existent')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
