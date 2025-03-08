import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ScrapingRequest } from '@types';

/**
 * DTO for web scraping requests with validation
 */
export class ScrapingRequestDto implements ScrapingRequest {
  @IsString()
  @IsNotEmpty()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    { message: 'URL must be a valid HTTP or HTTPS URL' },
  )
  url: string;
}
