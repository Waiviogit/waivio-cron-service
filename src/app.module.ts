import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { REDIS_IMPORTS } from './redis';
import { TasksModule } from './jobs/tasks.module';

@Module({
  imports: [
    ...REDIS_IMPORTS,
    ScheduleModule.forRoot(),
    TasksModule,
  ],
})
export class AppModule {}
