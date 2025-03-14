import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { LLMsModule } from './llms/llms.module';
import { MailModule } from './mail/mail.module';
import { WebScrapingModule } from './web-scraping/web-scraping.module';
import { HtmlMarkdownModule } from './html-markdown/html-markdown.module';
import { StdLlmTypeModule } from './std-llm-type/std-llm-type.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LLMsModule,
    MailModule,
    WebScrapingModule,
    HtmlMarkdownModule,
    StdLlmTypeModule,
  ],
})
export class AppModule {}
