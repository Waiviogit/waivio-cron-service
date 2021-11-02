import {
  Injectable, Inject, HttpStatus, HttpException,
} from '@nestjs/common';
import { FilterQuery, Model, UpdateWriteOpResult } from 'mongoose';
import { User } from './interfaces/user.interface';
import { USER_MODEL } from './constants';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_MODEL)
    private userModel: Model<User>,
  ) {}

  async find(filter: FilterQuery<any>, projection?: any | null, sort?: string | any): Promise<[User]> {
    try {
      return this.userModel.find(filter, projection).sort(sort).lean();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
