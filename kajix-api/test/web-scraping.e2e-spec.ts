import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  BadRequestException,
  RequestTimeoutException,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ContentType } from '../src/web-scraping/dto/content-type.enum';
import { WebScrapingService } from '../src/web-scraping/web-scraping.service';
import { HtmlMarkdownService } from '../src/html-markdown/html-markdown.service';

describe('WebScrapingController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let webScrapingService: WebScrapingService;

  const mockContent = {
    id: 'test-id',
    baseUrl: 'https://example.com',
    scrappedUrl: 'https://example.com/page1',
    lastScrappedAt: new Date(),
    htmlContent: '<html><body><h1>Test</h1></body></html>',
    markdownContent: '# Test',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockScrapingResponse = {
    sourceUrl: 'https://example.com',
    content: [
      {
        url: 'https://example.com',
        isExternal: false,
        title: 'Main Page',
        description: 'Main page description',
        text: 'Main content text',
        html: '<html><body>Main content</body></html>',
      },
    ],
    scrapedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WebScrapingService)
      .useValue({
        scrapeLinks: jest.fn().mockImplementation(async (request) => {
          // Validate URL
          try {
            const url = new URL(request.url);
            if (!['http:', 'https:'].includes(url.protocol)) {
              throw new BadRequestException(
                'URL must use HTTP or HTTPS protocol',
              );
            }
          } catch (error) {
            throw new BadRequestException('Invalid URL provided');
          }
          return mockScrapingResponse;
        }),
      })
      .overrideProvider(HtmlMarkdownService)
      .useValue({
        convertHtmlToMarkdown: jest.fn().mockResolvedValue({
          markdown: '# Converted Markdown',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    webScrapingService = app.get<WebScrapingService>(WebScrapingService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.scrappedContent.deleteMany();
    jest.clearAllMocks();

    // Seed test data
    await prisma.scrappedContent.create({
      data: mockContent,
    });
  });

  afterAll(async () => {
    await prisma.scrappedContent.deleteMany();
    await app.close();
  });

  describe('/web-scraping/scrape (POST)', () => {
    it('should scrape and save content', () => {
      return request(app.getHttpServer())
        .post('/web-scraping/scrape')
        .send({
          url: 'https://example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.sourceUrl).toBe('https://example.com');
          expect(Array.isArray(res.body.content)).toBe(true);
        });
    });

    it('should handle invalid URLs', () => {
      return request(app.getHttpServer())
        .post('/web-scraping/scrape')
        .send({
          url: 'invalid-url',
        })
        .expect(400);
    });
  });

  describe('/web-scraping/content (GET)', () => {
    it('should return markdown content by default', () => {
      return request(app.getHttpServer())
        .get('/web-scraping/content')
        .expect(200)
        .expect((res) => {
          expect(res.body.data[0].markdownContent).toBeDefined();
          expect(res.body.data[0].htmlContent).toBeUndefined();
        });
    });

    it('should return HTML content when requested', () => {
      return request(app.getHttpServer())
        .get('/web-scraping/content')
        .query({ contentType: ContentType.HTML })
        .expect(200)
        .expect((res) => {
          expect(res.body.data[0].htmlContent).toBeDefined();
          expect(res.body.data[0].markdownContent).toBeUndefined();
        });
    });

    it('should return both HTML and markdown content when requested', () => {
      return request(app.getHttpServer())
        .get('/web-scraping/content')
        .query({ contentType: ContentType.BOTH })
        .expect(200)
        .expect((res) => {
          expect(res.body.data[0].htmlContent).toBeDefined();
          expect(res.body.data[0].markdownContent).toBeDefined();
        });
    });

    it('should handle pagination', () => {
      return request(app.getHttpServer())
        .get('/web-scraping/content')
        .query({ page: 1, pageSize: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.pageSize).toBe(10);
          expect(res.body.meta.total).toBeDefined();
          expect(res.body.meta.totalPages).toBeDefined();
        });
    });

    it('should filter by baseUrl', () => {
      return request(app.getHttpServer())
        .get('/web-scraping/content')
        .query({ baseUrl: 'https://example.com' })
        .expect(200)
        .expect((res) => {
          expect(
            res.body.data.every(
              (item) => item.baseUrl === 'https://example.com',
            ),
          ).toBe(true);
        });
    });
  });

  describe('/web-scraping/content/:id (GET)', () => {
    it('should return markdown content by default', () => {
      return request(app.getHttpServer())
        .get(`/web-scraping/content/${mockContent.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.markdownContent).toBeDefined();
          expect(res.body.htmlContent).toBeUndefined();
        });
    });

    it('should return HTML content when requested', () => {
      return request(app.getHttpServer())
        .get(`/web-scraping/content/${mockContent.id}`)
        .query({ contentType: ContentType.HTML })
        .expect(200)
        .expect((res) => {
          expect(res.body.htmlContent).toBeDefined();
          expect(res.body.markdownContent).toBeUndefined();
        });
    });

    it('should return both HTML and markdown content when requested', () => {
      return request(app.getHttpServer())
        .get(`/web-scraping/content/${mockContent.id}`)
        .query({ contentType: ContentType.BOTH })
        .expect(200)
        .expect((res) => {
          expect(res.body.htmlContent).toBeDefined();
          expect(res.body.markdownContent).toBeDefined();
        });
    });

    it('should return 400 for non-existent content', () => {
      return request(app.getHttpServer())
        .get('/web-scraping/content/non-existent-id')
        .expect(400);
    });
  });

  describe('/web-scraping/scrape (POST) - Advanced Scenarios', () => {
    it('should handle successful scraping with multiple pages', async () => {
      const multiPageResponse = {
        sourceUrl: 'https://example.com',
        content: [
          {
            url: 'https://example.com',
            isExternal: false,
            title: 'Main Page',
            description: 'Main page description',
            text: 'Main content text',
            html: '<html><body>Main content</body></html>',
          },
          {
            url: 'https://example.com/page1',
            isExternal: false,
            title: 'Page 1',
            description: 'Page 1 description',
            text: 'Page 1 content',
            html: '<html><body>Page 1 content</body></html>',
          },
        ],
        scrapedAt: new Date(),
      };

      jest
        .spyOn(webScrapingService, 'scrapeLinks')
        .mockResolvedValueOnce(multiPageResponse);

      const response = await request(app.getHttpServer())
        .post('/web-scraping/scrape')
        .send({
          url: 'https://example.com',
        })
        .expect(201);

      expect(response.body.sourceUrl).toBe('https://example.com');
      expect(response.body.content).toHaveLength(2);
      expect(response.body.content[0].title).toBe('Main Page');
      expect(response.body.content[1].title).toBe('Page 1');
    });

    it('should handle timeout errors', async () => {
      jest
        .spyOn(webScrapingService, 'scrapeLinks')
        .mockRejectedValueOnce(new RequestTimeoutException('Request Timeout'));

      await request(app.getHttpServer())
        .post('/web-scraping/scrape')
        .send({
          url: 'https://example.com',
        })
        .expect(408);
    });

    it('should handle scraping errors', async () => {
      jest
        .spyOn(webScrapingService, 'scrapeLinks')
        .mockRejectedValueOnce(
          new BadRequestException('Failed to scrape content'),
        );

      await request(app.getHttpServer())
        .post('/web-scraping/scrape')
        .send({
          url: 'https://example.com',
        })
        .expect(400);
    });
  });
});
