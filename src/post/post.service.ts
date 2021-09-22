import {
  Injectable, Inject, HttpStatus, HttpException,
} from '@nestjs/common';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { Post } from './interfaces/post.interface';
import { POST_MODEL } from './constants';

@Injectable()
export class PostsService {
  constructor(
    @Inject(POST_MODEL)
    private postModel: Model<Post>,
  ) {}

  async findOneByRootAuthorPermlink(root_author: string, permlink: string):Promise<Post> {
    try {
      return this.postModel.findOne({ root_author, permlink }).lean();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOneByRoot(data: any): Promise<UpdateWriteOpResult> {
    try {
      const { root_author, permlink } = data;
      return this.postModel.updateOne({ root_author, permlink }, data);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
