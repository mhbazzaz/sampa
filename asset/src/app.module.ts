import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetCategoryModule } from './asset-category/asset-category.module';
import { AssetRelationTypeModule } from './asset-relation-type/asset-relation-type.module';
import { AssetTypeModule } from './asset-type/asset-type.module';
import { AssetModule } from './asset/asset.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { typeOrmConfig } from './config/typeorm-config';
import { CronService } from './crons/cron.service';
import { FileModule } from './file/file.module';
import { FilterModule } from './filter/filter.module';
import { AppI18nModule } from './i18n/i18n.module';
import { LocationTypeModule } from './location-type/location-type.module';
import { LocationModule } from './location/location.module';
import { LoggerModule } from './logger/logger.module';
import { TagModule } from './tag/tag.module';
import { UsersModule } from './users/user.module';
import { ActionLogModule } from './action-log/action-log.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AppI18nModule,
    LoggerModule,
    FilterModule,
    AssetRelationTypeModule,
    AssetCategoryModule,
    AssetTypeModule,
    AssetModule,
    UsersModule,
    LocationModule,
    LocationTypeModule,
    TagModule,
    FileModule,
    ScheduleModule.forRoot(),
    ActionLogModule,
  ],
  controllers: [],
  providers: [CronService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
