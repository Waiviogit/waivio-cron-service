import { configService} from '../common/config/config.service'
import { RedisModule } from 'nestjs-redis';

export const REDIS_IMPORTS = [
  RedisModule.register([
    configService.getRedisExpirePostConfig()
  ]),
];

