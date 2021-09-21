import {Injectable, Inject, HttpStatus, HttpException} from '@nestjs/common';
import { Model, UpdateWriteOpResult} from 'mongoose';
import { Post } from './interfaces/post.interface';
import {POST_MODEL} from "./constants";



@Injectable()
export class PostsService {
  constructor(
    @Inject(POST_MODEL)
    private postModel: Model<Post>,
  ) {}

  async findOneByRootAuthorPermlink(root_author: string, permlink: string ):Promise<Post> {
    try {
      return this.postModel.findOne({root_author, permlink}).lean();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOne(data: Post): Promise<UpdateWriteOpResult> {
    try {
      const {author, permlink} = data;
      return this.postModel.updateOne({author, permlink}, data, {upsert: true})
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
