import { Module } from '@nestjs/common';
import { WebScrapingController } from './web-scraping.controller';
import { WebScrapingService } from './web-scraping.service';

/**
 * Module for web scraping functionality
 */
@Module({
  controllers: [WebScrapingController],
  providers: [WebScrapingService],
  exports: [WebScrapingService], // Export service if needed by other modules
})
export class WebScrapingModule {}
