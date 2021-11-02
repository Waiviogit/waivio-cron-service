import { Connection, Model } from 'mongoose';
import { MONGODB_WAIVIO_CONNECTION } from '../common/constants';
import { UserSchema } from './user.schema';
import { USER_MODEL } from './constants';

export const userProviders = [
  {
    provide: USER_MODEL,
    useFactory: (connection: Connection): Model<Connection> => connection.model('User', UserSchema),
    inject: [MONGODB_WAIVIO_CONNECTION],
  },
];
