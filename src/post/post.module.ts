import { DatabaseModule } from '../database/database.module';
import { postsProviders } from './post.providers';
import { PostsService } from './post.service';
import { Module } from '@nestjs/common';

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
