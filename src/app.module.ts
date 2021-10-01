import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { HiveMindService } from './hiveApi/hive-mind.service';
import { DatabaseModule } from './database/database.module';
import { TasksService } from './jobs/task.service';
import { PostModule } from './post/post.module';
import { REDIS_IMPORTS } from './redis';

@Module({
  imports: [
    PostModule,
    DatabaseModule,
    ...REDIS_IMPORTS,
    ScheduleModule.forRoot(),
  ],
  providers: [
    TasksService,
    HiveMindService,
  ],
})
export class AppModule {}
