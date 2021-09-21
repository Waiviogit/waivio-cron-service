import {MONGODB_WAIVIO_CONNECTION} from "../common/constants";
import mongoose, { Connection } from 'mongoose';
import { PostSchema } from './post.schema';
import {POST_MODEL} from "./constants";

export const postsProviders = [
  {
    provide: POST_MODEL,
    useFactory: (connection: Connection): mongoose.Model<Connection> => connection.model('Post', PostSchema),
    inject: [MONGODB_WAIVIO_CONNECTION],
  },
];