import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { postsProviders } from './post.providers';
import { PostsService } from './post.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    PostsService,
    ...postsProviders,
  ],
  exports: [
    PostsService,
    ...postsProviders,
  ],
})
export class PostModule {}
