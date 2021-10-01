import axios from 'axios';
import * as _ from 'lodash';
import { Post } from '../../post/interfaces/post.interface';

export const getPost = async (author: string, permlink: string):Promise<Post> => {
  try {
    const resp = await axios.post(
      'https://blocks.waivio.com:8082',
      {
        jsonrpc: '2.0',
        method: 'condenser_api.get_content',
        params: [author, permlink],
        id: 1,
      },
      { timeout: 8000 },
    );
    return _.get(resp, 'data.result');
  } catch (error) {
    return null;
  }
};
