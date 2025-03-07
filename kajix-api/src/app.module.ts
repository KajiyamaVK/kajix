import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { LLMsModule } from './llms/llms.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    LLMsModule,
    UsersModule,
    AuthModule,
    MailModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
