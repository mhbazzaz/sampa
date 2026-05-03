import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetModule } from 'src/asset/asset.module';
import { GroupMembershipModule } from 'src/group-membership/group-membership.module';
import { MemberModule } from 'src/member/member.module';
import { GroupController } from './controllers/group.controller';
import { Group } from './entities/group.entity';
import { GroupRepository } from './repositories/group.repository';
import { GroupService } from './services/group.service';
import { CheckGroupExistValidator } from './validators/check-group-exists.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
    forwardRef(() => GroupMembershipModule),
    AssetModule,
    MemberModule,
  ],
  controllers: [GroupController],
  providers: [GroupService, GroupRepository, CheckGroupExistValidator],
  exports: [GroupService, GroupRepository],
})
export class GroupModule {}
