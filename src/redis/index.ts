import { RedisModule } from 'nestjs-redis';
import { configService } from '../common/config/config.service';

export const REDIS_IMPORTS = [
  RedisModule.register([
    configService.getRedisExpirePostConfig(),
  ]),
];
