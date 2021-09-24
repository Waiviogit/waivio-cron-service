import { NestFactory } from '@nestjs/core';
import { configService } from './common/config/config.service';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(configService.getPort());
}
bootstrap();
