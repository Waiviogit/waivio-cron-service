import { Module } from '@nestjs/common';
import { PostsService } from './post.service';
import { postsProviders } from './post.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    PostsService,
    ...postsProviders,
  ],
  exports: [
    PostsService,
    ...postsProviders,
  ]
})
export class PostModule {}
