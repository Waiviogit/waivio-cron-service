import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import axios from 'axios';
import { Client, PrivateKey } from '@hiveio/dhive';
import { RPC_NODES_HIVEMIND, RPC_NODES_HIVED } from '../common/constants';
import { Post } from '../post/interfaces/post.interface';

@Injectable()
export class HiveMindService {
  private readonly logger = new Logger(HiveMindService.name);
  private readonly hiveMindNodes = RPC_NODES_HIVEMIND;
  private readonly hivedNodes = RPC_NODES_HIVED;
  private hiveMindNode = this.hiveMindNodes[0]
  private hivedNode = this.hivedNodes[0]
  private broadcastClient = new Client(RPC_NODES_HIVED, { failoverThreshold: 0, timeout: 10 * 1000 });

  private changeNode(api) {
    const index = this[`${api}Nodes`].indexOf(this[`${api}Node`]);
    this[`${api}Node`] = this[`${api}Nodes`].length - 1 === index
      ? this[`${api}Nodes`][0]
      : this[`${api}Nodes`][index + 1];
    this.logger.error(`Node URL was changed to ${this[`${api}Node`]}`);
  }

  private async hiveRequest(
    method: string, params: any, api = 'hiveMind',
  ):Promise<any> {
    try {
      const resp = await axios.post(
        this[`${api}Node`],
        {
          jsonrpc: '2.0',
          method,
          params,
          id: 1,
        },
        { timeout: 8000 },
      );
      if (_.has(_.get(resp, 'data'), 'error')) {
        this.changeNode(api);
        return null;
      }
      return _.get(resp, 'data.result');
    } catch (err) {
      this.logger.error(err.message);
      this.changeNode(api);
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

  async getAccounts(accounts):Promise<any> {
    return this.hiveRequest('condenser_api.get_accounts', [accounts], 'hived');
  }

  async vote({
    voter, author, permlink, weight, key,
  }) {
    try {
      const result = await this.broadcastClient.broadcast.vote({
        voter, author, permlink, weight,
      },
      PrivateKey.fromString(key));
      return { result: !!result };
    } catch (error) {
      return { error };
    }
  }
}
