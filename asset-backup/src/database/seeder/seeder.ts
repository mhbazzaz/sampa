import { connectionSource } from 'src/config/typeorm-connection-source';
import { ActionSeeder } from './action';
import { ActionRoleSeeder } from './action-role';
import { AssetCategorySeeder } from './asset-category';
import { AssetRelationTypeSeeder } from './asset-relation-type';
import { AssetScoreSeeder } from './asset-score';
import { AssetScoringFactorSeeder } from './asset-scoring-factor';
import { AssetTypeSeeder } from './asset-type';
import { AssetTypeRelationSeeder } from './asset-type-relation';
import { assetSeeder } from './assets';
import { LocationSeeder } from './location';
import { LocationTypeSeeder } from './location-type';
import { ProcessSeeder } from './process';
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
  await AssetCategorySeeder(connectionSource);
  await AssetRelationTypeSeeder(connectionSource);
  await LocationTypeSeeder(connectionSource);
  await LocationSeeder(connectionSource);
  await AssetTypeSeeder(connectionSource);
  await AssetTypeRelationSeeder(connectionSource);
  await assetSeeder(connectionSource);
  await AssetScoringFactorSeeder(connectionSource);
  await AssetScoreSeeder(connectionSource);
};

init();
