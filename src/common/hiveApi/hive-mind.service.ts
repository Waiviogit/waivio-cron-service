import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@hiveio/dhive';
import { Post } from '../../post/interfaces/post.interface';
import { RPC_NODES_HIVEMIND } from '../constants';

const client = new Client(RPC_NODES_HIVEMIND, { timeout: 8000 });

@Injectable()
export class HiveMindService {
  private readonly logger = new Logger(HiveMindService.name);

  async getPost(author: string, permlink: string):Promise<Post> {
    try {
      return client.database.call('get_content', [author, permlink]);
    } catch (err) {
      this.logger.error(err.message);
      return null;
    }
  }
}
