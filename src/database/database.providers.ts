import { MONGODB_WAIVIO_CONNECTION } from '../common/constants';
import { configService } from '../common/config/config.service'
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: MONGODB_WAIVIO_CONNECTION,
    useFactory: (): Promise<typeof mongoose> => {
      return mongoose.connect(configService.getMongoWaivioConnectionString())
    }
  },
];
