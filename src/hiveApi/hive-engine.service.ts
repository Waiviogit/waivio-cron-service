import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import axios from 'axios';
import { RPC_NODES_HIVE_ENGINE } from '../common/constants';
import { RewardPool } from './interfaces/hive-engine.interface';

@Injectable()
export class HiveEngineService {
  private readonly logger = new Logger(HiveEngineService.name);
  private readonly rpcNodes = RPC_NODES_HIVE_ENGINE;
  private async hiveEngineRequest(
    endpoint: string,
    method: string,
    params: any,
    cb: (data: Record<string, any>) => any,
  ):Promise<any> {
    try {
      const resp = await axios.post(
        `${this.currentNode}${endpoint}`,
        {
          jsonrpc: '2.0',
          method,
          params,
          id: 'ssc-mainnet-hive',
        },
        { timeout: 8000 },
      );
      if (_.has(_.get(resp, 'data'), 'error')) {
        this.changeNode();
        return null;
      }
      return cb(resp);
    } catch (err) {
      this.logger.error(err.message);
      this.changeNode();
      return null;
    }
  }

  private currentNode = this.rpcNodes[0]

  private changeNode() {
    const index = this.rpcNodes.indexOf(this.currentNode);
    this.currentNode = this.rpcNodes.length - 1 === index
      ? this.rpcNodes[0]
      : this.rpcNodes[index + 1];
    this.logger.error(`Node URL was changed to ${this.currentNode}`);
  }

  async getRewardPool(_id: number): Promise<RewardPool> {
    const params = {
      contract: 'comments',
      table: 'rewardPools',
      query: { _id },
    };
    return this.hiveEngineRequest(
      '/contracts',
      'find',
      params,
      (response) => _.get(response, 'data.result[0]'),
    );
  }
}
