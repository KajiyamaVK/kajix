import { Module } from '@nestjs/common';
import { WebScrapingController } from './web-scraping.controller';
import { WebScrapingService } from './web-scraping.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HtmlMarkdownModule } from '../html-markdown/html-markdown.module';

/**
 * Module for web scraping functionality
 */
@Module({
  imports: [PrismaModule, HtmlMarkdownModule],
  controllers: [WebScrapingController],
  providers: [WebScrapingService],
  exports: [WebScrapingService], // Export service if needed by other modules
})
export class WebScrapingModule {}
