import {HiveMindService} from './common/hiveApi/hive-mind.service';
import {DatabaseModule} from './database/database.module';
import {TasksService} from './jobs/task.service';
import {ScheduleModule} from '@nestjs/schedule';
import { PostModule } from './post/post.module'
import { Module } from '@nestjs/common';
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
