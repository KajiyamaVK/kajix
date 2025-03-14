import { ApiProperty } from '@nestjs/swagger';
import { PageContent } from '@types';

/**
 * DTO for page content from web scraping
 */
export class PageContentDto implements PageContent {
  @ApiProperty({
    description: 'The URL of the page',
    example: 'https://example.com/page',
  })
  url: string;

  @ApiProperty({
    description: 'Whether the URL points to an external domain',
    example: false,
  })
  isExternal: boolean;

  @ApiProperty({
    description: 'The page title',
    example: 'Example Domain',
    nullable: true,
  })
  title: string | null;

  @ApiProperty({
    description: 'The page description (meta description)',
    example: 'This domain is for use in examples',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'The main text content of the page',
    example: 'Example Domain This domain is for use in examples.',
  })
  text: string;

  @ApiProperty({
    description: 'HTML content of the page',
    example:
      '<html><body><h1>Example Domain</h1><p>This domain is for use in examples.</p></body></html>',
  })
  html: string;

  @ApiProperty({
    description: 'Markdown version of the HTML content',
    example: '# Example Domain\n\nThis domain is for use in examples.',
    nullable: true,
  })
  markdown?: string;
}
