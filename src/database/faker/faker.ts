import { connectionSource } from 'src/config/typeorm-connection-source';
import { DataSource } from 'typeorm';
import { AssetToAuditFaker } from './asset-to-audit';
import { EnvironmentFaker } from './environment';

const init = async () => {
  await connectionSource.initialize();

  const fakerObj: Record<string, (datasource: DataSource) => Promise<boolean>> =
    {
      AssetToAudit: AssetToAuditFaker,
      Environment: EnvironmentFaker,
    };

  process.argv.slice(2).forEach((value) => {
    const key = value.split('=');
    key[0] = key[0].substring(2);
    if (key[0] === 'name') {
      key[1].split(',').forEach((model) => {
        if (fakerObj[model]) {
          fakerObj[model](connectionSource);
        }
      });
    }
  });
};

init();
