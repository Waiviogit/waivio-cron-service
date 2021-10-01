import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { HiveMindService } from '../hiveApi/hive-mind.service';
import { PostModule } from '../post/post.module';

@Module({
  imports: [PostModule],
  providers: [
    TasksService,
    HiveMindService,
  ],
})
export class TasksModule {}
