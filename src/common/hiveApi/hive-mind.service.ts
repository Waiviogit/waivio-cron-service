import { Post } from '../../post/interfaces/post.interface';
import { Injectable, Logger } from '@nestjs/common';
import { RPC_NODES_HIVEMIND } from '../constants';
import { Client }  from '@hiveio/dhive';

@Injectable()
export class HiveMindService {
  private readonly logger = new Logger(HiveMindService.name);
  private hiveMindClient = new Client(RPC_NODES_HIVEMIND, { timeout: 8000 });

  async getPost(author: string, permlink: string):Promise<Post> {
    try {
      return this.hiveMindClient.database.call('get_content', [author, permlink])
    } catch (err) {
      this.logger.error(err.message)
      return null
    }
  }
}
