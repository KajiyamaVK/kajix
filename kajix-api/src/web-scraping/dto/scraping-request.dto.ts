import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { ScrapingRequest } from '@kajix/types';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for web scraping requests with validation
 */
export class ScrapingRequestDto implements ScrapingRequest {
  @ApiProperty({
    description: 'URL to scrape (protocol will be added if missing)',
    example: 'https://example.com',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    // Add https:// prefix if protocol is missing
    if (typeof value === 'string' && !value.match(/^https?:\/\//i)) {
      return `https://${value}`;
    }
    return value;
  })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    { message: 'URL must be a valid HTTP or HTTPS URL' },
  )
  url: string;
}
