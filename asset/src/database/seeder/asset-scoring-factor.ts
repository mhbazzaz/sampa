import { AssetScoringFactor } from 'src/asset/entities/asset-scoring-factor.entity';
import { DataSource } from 'typeorm';

const assetScoringFactors: {
  title: string;
  description: string;
  weight: number;
}[] = [
  {
    title: 'Financial',
    description: ' اثر مالی مستقیم یا غیرمستقیم در صورت اختلال دارایی',
    weight: 0.2,
  },
  {
    title: 'Reputation / Regulatory',
    description:
      'اثر بر اعتبار سازمان یا الزامات قانونی/نظارتی  در صورت اختلال دارایی',
    weight: 0.15,
  },
  {
    title: 'Confidentiality',
    description: 'اثر حفظ محرمانگی اطلاعات  در صورت اختلال دارایی',
    weight: 0.15,
  },
  {
    title: 'Integrity',
    description: 'اثر صحت و کامل بودن داده‌ها در صورت اختلال دارایی',
    weight: 0.15,
  },
  {
    title: 'Availability',
    description: 'اثر در دسترس بودن دارایی برای سرویس  در صورت اختلال دارایی',
    weight: 0.35,
  },
];

export const AssetScoringFactorSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < assetScoringFactors.length; i++) {
    const element = assetScoringFactors[i];

    const assetScoringFactor = await datasource
      .getRepository(AssetScoringFactor)
      .findOne({
        where: {
          title: element.title,
        },
      });

    if (assetScoringFactor) {
      await datasource.getRepository(AssetScoringFactor).update(
        { id: assetScoringFactor.id },
        {
          description: element.description,
          weight: element.weight,
        },
      );
      continue;
    }

    await datasource.getRepository(AssetScoringFactor).save(
      new AssetScoringFactor({
        ...element,
      }),
    );
  }

  return true;
};
