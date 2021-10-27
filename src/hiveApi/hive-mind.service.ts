import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import axios from 'axios';
import { RPC_NODES_HIVEMIND } from '../common/constants';
import { Post } from '../post/interfaces/post.interface';

@Injectable()
export class HiveMindService {
  private readonly logger = new Logger(HiveMindService.name);
  private readonly rpcNodes = RPC_NODES_HIVEMIND;
  private currentNode = this.rpcNodes[0]

  private changeNode() {
    const index = this.rpcNodes.indexOf(this.currentNode);
    this.currentNode = this.rpcNodes.length - 1 === index
      ? this.rpcNodes[0]
      : this.rpcNodes[index + 1];
    this.logger.error(`Node URL was changed to ${this.currentNode}`);
  }

  private async hiveRequest(method: string, params: any):Promise<any> {
    try {
      const resp = await axios.post(
        this.currentNode,
        {
          jsonrpc: '2.0',
          method,
          params,
          id: 1,
        },
        { timeout: 8000 },
      );
      if (_.has(_.get(resp, 'data'), 'error')) {
        this.changeNode();
        return null;
      }
      return _.get(resp, 'data.result');
    } catch (err) {
      this.logger.error(err.message);
      this.changeNode();
      return null;
    }
  }

  async getPost(author: string, permlink: string):Promise<Post> {
    return this.hiveRequest('condenser_api.get_content', [author, permlink]);
  }

  async getDynamicGlobalProperties() {
    return this.hiveRequest('condenser_api.get_reward_fund', ['post']);
  }
  async getCurrentPriceInfo() {
    return this.hiveRequest('condenser_api.get_current_median_history_price', []);
  }
}
