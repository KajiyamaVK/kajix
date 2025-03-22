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
import { ScrapingResponse } from '@kajix/types';
import { ScrappedContentDto } from './dto/scrapped-content.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { ContentType } from './dto/content-type.enum';
import { ScrapingRequestDto } from './dto/scraping-request.dto';
import { ScrapingResponseDto } from './dto/scraping-response.dto';

/**
 * Generic paginated response DTO for Swagger documentation
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}

/**
 * Generic paginated response DTO for Swagger documentation
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

// For internal use, not exposed in Swagger
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
@ApiTags('Web Scraping')
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
  @ApiOperation({ summary: 'Scrape content from a URL and its links' })
  @ApiBody({
    type: ScrapingRequestDto,
    description: 'URL and options for scraping',
    required: true,
    examples: {
      example1: {
        summary: 'Basic scrape request',
        description: 'A request to scrape a URL',
        value: {
          url: 'https://example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Content successfully scraped and saved',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ScrapingResponseDto',
          example: {
            sourceUrl: 'https://example.com',
            content: [
              {
                url: 'https://example.com',
                isExternal: false,
                title: 'Example Domain',
                description: 'This domain is for use in examples',
                text: 'Example Domain This domain is for use in examples.',
                html: '<html><body><h1>Example Domain</h1><p>This domain is for use in examples.</p></body></html>',
                markdown:
                  '# Example Domain\n\nThis domain is for use in examples.',
              },
            ],
            scrapedAt: '2023-01-01T12:00:00.000Z',
          },
        },
      },
    },
  })
  async scrapeLinks(
    @Body() request: ScrapingRequestDto,
  ): Promise<ScrapingResponse> {
    try {
      // Check if URL has protocol, if not prepend https://
      if (request.url && !request.url.match(/^https?:\/\//i)) {
        request.url = `https://${request.url}`;
      }

      // Validate URL before proceeding
      try {
        const url = new URL(request.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new BadRequestException('URL must use HTTP or HTTPS protocol');
        }
        request.url = url.toString(); // Normalize the URL
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Invalid URL format: ${error.message}`);
      }

      return this.webScrapingService.scrapeLinks(request);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Error processing request: ${error.message}`,
      );
    }
  }

  @Get('content')
  @ApiOperation({ summary: 'Get all scrapped content with pagination' })
  @ApiQuery({
    name: 'baseUrl',
    required: false,
    description: 'Filter by base URL',
    example: 'https://example.com',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'contentType',
    required: false,
    description: 'Type of content to return (markdown, html, or both)',
    enum: ContentType,
    default: ContentType.MARKDOWN,
    example: ContentType.MARKDOWN,
  })
  @ApiResponse({
    status: 200,
    description: 'List of scrapped content with pagination metadata',
    content: {
      'application/json': {
        schema: {
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ScrappedContentDto',
              },
              description: 'Array of scrapped content items',
            },
            meta: {
              type: 'object',
              properties: {
                total: {
                  type: 'number',
                  example: 100,
                  description: 'Total number of items',
                },
                page: {
                  type: 'number',
                  example: 1,
                  description: 'Current page number',
                },
                pageSize: {
                  type: 'number',
                  example: 10,
                  description: 'Number of items per page',
                },
                totalPages: {
                  type: 'number',
                  example: 10,
                  description: 'Total number of pages',
                },
              },
            },
          },
        },
      },
    },
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
    example: ContentType.MARKDOWN,
  })
  @ApiResponse({
    status: 200,
    description: 'The scrapped content',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ScrappedContentDto',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Content not found',
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
