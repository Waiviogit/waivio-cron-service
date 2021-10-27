import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { HiveMindService } from '../hiveApi/hive-mind.service';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';
import { HiveEngineService } from '../hiveApi/hive-engine.service';

@Module({
  imports: [PostModule, UserModule],
  providers: [
    TasksService,
    HiveMindService,
    HiveEngineService,
  ],
})
export class TasksModule {}
