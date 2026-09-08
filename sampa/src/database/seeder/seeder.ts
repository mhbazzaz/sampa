import { connectionSource } from 'src/config/typeorm-connection-source';
import { ActionSeeder } from './action';
import { ActionRoleSeeder } from './action-role';
import { AssessmentTypeSeeder } from './assessment-type';
import { AssetCategorySeeder } from './asset-category';
import { AssetTypeSeeder } from './asset-type';
import { EnvironmentSeeder } from './environment';
import { ProcessSeeder } from './process';
import { RequestSpecItemSeeder } from './request-spec-item';
import { RoleSeeder } from './role';
import { StateSeeder } from './state';
import { stateTransitionSeeder } from './state-transition';

const init = async () => {
  await connectionSource.initialize();
  await RoleSeeder(connectionSource);
  await ProcessSeeder(connectionSource);
  await StateSeeder(connectionSource);
  await ActionSeeder(connectionSource);
  await ActionRoleSeeder(connectionSource);
  await stateTransitionSeeder(connectionSource);
  await AssessmentTypeSeeder(connectionSource);
  await AssetCategorySeeder(connectionSource);
  await AssetTypeSeeder(connectionSource);
  await EnvironmentSeeder(connectionSource);
  await RequestSpecItemSeeder(connectionSource);
};

init();
