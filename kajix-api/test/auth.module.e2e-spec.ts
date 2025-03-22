// auth.module.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../src/auth/auth.module'; // Correct relative path
import { ConfigModule } from '@nestjs/config';

describe('AuthModule (Isolated)', () => {
  it('should compile the module', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
        AuthModule,
      ],
    }).compile();

    expect(moduleFixture).toBeDefined();
  });
});
