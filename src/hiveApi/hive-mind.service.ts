import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import axios from 'axios';
import { HIVEMIND_NODE_DEFAULT } from '../common/constants';
import { Post } from '../post/interfaces/post.interface';

@Injectable()
export class HiveMindService {
  private readonly logger = new Logger(HiveMindService.name);

  async getPost(author: string, permlink: string):Promise<Post> {
    try {
      const resp = await axios.post(
        HIVEMIND_NODE_DEFAULT,
        {
          jsonrpc: '2.0',
          method: 'condenser_api.get_content',
          params: [author, permlink],
          id: 1,
        },
        { timeout: 8000 },
      );
      return _.get(resp, 'data.result');
    } catch (err) {
      this.logger.error(err.message);
      return null;
    }
  }
}
