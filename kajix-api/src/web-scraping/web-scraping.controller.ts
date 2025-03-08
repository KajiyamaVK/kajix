import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { WebScrapingService } from './web-scraping.service';
import { ScrapingRequest, ScrapingResponse } from '@types';
import { ScrappedContentDto } from './dto/scrapped-content.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ContentType } from './dto/content-type.enum';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Convert Prisma result to DTO type
 */
function toDtoType(content: {
  id: string;
  baseUrl: string;
  scrappedUrl: string;
  lastScrappedAt: Date;
  htmlContent: string;
  markdownContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ScrappedContentDto {
  return {
    ...content,
    markdownContent: content.markdownContent || undefined,
  };
}

/**
 * Filter content based on the requested content type
 */
function filterContent(
  content: ScrappedContentDto,
  contentType: ContentType = ContentType.MARKDOWN,
): Partial<ScrappedContentDto> {
  const baseFields = {
    id: content.id,
    baseUrl: content.baseUrl,
    scrappedUrl: content.scrappedUrl,
    lastScrappedAt: content.lastScrappedAt,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  };

  switch (contentType) {
    case ContentType.HTML:
      return {
        ...baseFields,
        htmlContent: content.htmlContent,
      };
    case ContentType.MARKDOWN:
      return {
        ...baseFields,
        markdownContent: content.markdownContent || undefined,
      };
    case ContentType.BOTH:
      return {
        ...baseFields,
        htmlContent: content.htmlContent,
        markdownContent: content.markdownContent || undefined,
      };
    default:
      return {
        ...baseFields,
        markdownContent: content.markdownContent || undefined,
      };
  }
}

/**
 * Controller for web scraping operations
 */
@ApiTags('web-scraping')
@Controller('web-scraping')
export class WebScrapingController {
  constructor(
    private readonly webScrapingService: WebScrapingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Scrape all links from the provided URL
   * @param requestDto The scraping request with URL
   * @returns All links found on the page
   */
  @Post('scrape')
  @ApiOperation({ summary: 'Scrape content from a URL and its linked pages' })
  @ApiResponse({
    status: 201,
    description: 'Content successfully scraped and saved',
  })
  async scrapeLinks(
    @Body() request: ScrapingRequest,
  ): Promise<ScrapingResponse> {
    try {
      // Validate URL before proceeding
      const url = new URL(request.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new BadRequestException('URL must use HTTP or HTTPS protocol');
      }
      request.url = url.toString(); // Normalize the URL
      return this.webScrapingService.scrapeLinks(request);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid URL provided');
    }
  }

  @Get('content')
  @ApiOperation({ summary: 'Get all scrapped content with pagination' })
  @ApiQuery({
    name: 'baseUrl',
    required: false,
    description: 'Filter by base URL',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    type: 'number',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
    type: 'number',
  })
  @ApiQuery({
    name: 'contentType',
    required: false,
    description: 'Type of content to return (markdown, html, or both)',
    enum: ContentType,
    default: ContentType.MARKDOWN,
  })
  @ApiResponse({
    status: 200,
    description: 'List of scrapped content with pagination metadata',
  })
  async getAllContent(
    @Query('baseUrl') baseUrl?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('contentType') contentType: ContentType = ContentType.MARKDOWN,
  ): Promise<PaginatedResponse<Partial<ScrappedContentDto>>> {
    // Validate pagination parameters
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    // Get total count for pagination
    const total = await this.prisma.scrappedContent.count({
      where: baseUrl ? { baseUrl } : undefined,
    });

    // Get paginated data
    const contents = await this.prisma.scrappedContent.findMany({
      where: baseUrl ? { baseUrl } : undefined,
      orderBy: { lastScrappedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: contents.map((content) =>
        filterContent(toDtoType(content), contentType),
      ),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  @Get('content/:id')
  @ApiOperation({ summary: 'Get scrapped content by ID' })
  @ApiQuery({
    name: 'contentType',
    required: false,
    description: 'Type of content to return (markdown, html, or both)',
    enum: ContentType,
    default: ContentType.MARKDOWN,
  })
  @ApiResponse({
    status: 200,
    description: 'The scrapped content',
    type: ScrappedContentDto,
  })
  async getContentById(
    @Param('id') id: string,
    @Query('contentType') contentType: ContentType = ContentType.MARKDOWN,
  ): Promise<Partial<ScrappedContentDto>> {
    const content = await this.prisma.scrappedContent.findUnique({
      where: { id },
    });

    if (!content) {
      throw new BadRequestException(`Content with ID ${id} not found`);
    }

    return filterContent(toDtoType(content), contentType);
  }
}
