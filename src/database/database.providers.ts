import * as mongoose from 'mongoose';
import { MONGODB_WAIVIO_CONNECTION } from '../common/constants';
import { configService } from '../common/config/config.service';

export const databaseProviders = [
  {
    provide: MONGODB_WAIVIO_CONNECTION,
    useFactory: (): Promise<typeof mongoose> => (
      mongoose.connect(configService.getMongoWaivioConnectionString())),
  },
];
