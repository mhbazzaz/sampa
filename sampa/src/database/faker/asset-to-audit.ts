import { fakerFA } from '@faker-js/faker';
import { AssetToAudit } from 'src/asset/entities/asset-to-audit.entity';
import { DataSource } from 'typeorm';

export const AssetToAuditFaker = async (datasource: DataSource) => {
  for (let i = 0; i < 10; i++) {
    const assetToAudit = new AssetToAudit({
      title: fakerFA.vehicle.model(),
    });

    const record = await datasource
      .getRepository(AssetToAudit)
      .findOne({ where: { title: assetToAudit.title } });

    if (record) {
      continue;
    }

    await datasource.getRepository(AssetToAudit).save(assetToAudit);
  }

  return true;
};
