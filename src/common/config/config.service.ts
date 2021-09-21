import {RedisConfigInterface} from "./interfaces/redis-config.interface";
import {ENSURE_VALUES, REDIS_EXPIRE_CLIENT} from "../constants";
import * as dotenv from 'dotenv';

dotenv.config({ path: `env/${process.env.NODE_ENV || 'development'}.env` });

class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  private getValue(key: string, throwOnMissing = true): string | number {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`)
    }
    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  public getMongoWaivioConnectionString():string {
    const host = this.getValue('MONGO_HOST')
    const port = this.getValue('MONGO_PORT')
    const db = this.getValue('WAIVIO_DB')
    return `mongodb://${host}:${port}/${db}`
  }

  public getRedisExpirePostConfig (): RedisConfigInterface {
    return {
      host: this.getValue('REDIS_HOST') as string,
      port: this.getValue('REDIS_PORT') as number,
      db: this.getValue('REDIS_DB_EXPIRE') as number,
      name: REDIS_EXPIRE_CLIENT
    }
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

}

const configService = new ConfigService(process.env).ensureValues(ENSURE_VALUES)

export { configService };
