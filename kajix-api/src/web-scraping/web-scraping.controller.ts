import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { WebScrapingService } from './web-scraping.service';
import { ScrapingRequestDto } from './dto/scraping-request.dto';
import { ScrapingResponse } from '@types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Controller for web scraping operations
 */
@Controller('web-scraping')
@UseGuards(JwtAuthGuard) // Requiring authentication for web scraping endpoints
export class WebScrapingController {
  private readonly logger = new Logger(WebScrapingController.name);

  constructor(private readonly webScrapingService: WebScrapingService) {}

  /**
   * Scrape all links from the provided URL
   * @param requestDto The scraping request with URL
   * @returns All links found on the page
   */
  @Post()
  async scrapeLinks(
    @Body() requestDto: ScrapingRequestDto,
  ): Promise<ScrapingResponse> {
    this.logger.log(`Received request to scrape: ${requestDto.url}`);
    return this.webScrapingService.scrapeLinks(requestDto);
  }
}
