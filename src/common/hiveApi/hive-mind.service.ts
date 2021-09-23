import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Post } from '../../post/interfaces/post.interface';
import { RPC_NODES_HIVEMIND } from '../constants';
import { Client }  from '@hiveio/dhive';

@Injectable()
export class HiveMindService {
  private hiveMindClient = new Client(RPC_NODES_HIVEMIND);

  async getPost(author: string, permlink: string):Promise<Post> {
    try {
      return this.hiveMindClient.database.call('get_content', [author, permlink])
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
