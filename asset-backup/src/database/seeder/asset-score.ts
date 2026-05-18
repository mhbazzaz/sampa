import { NotFoundException } from '@nestjs/common';
import { AssetScore } from 'src/asset/entities/asset-score.entity';
import { AssetScoringFactor } from 'src/asset/entities/asset-scoring-factor.entity';
import { DataSource } from 'typeorm';

const assetScores: {
  factor: string;
  description: string;
  value: number;
}[] = [
  {
    factor: 'Financial',
    description: 'بدون خسارت مالی',
    value: 1,
  },
  {
    factor: 'Financial',
    description: 'خسارت بسیار جزئی (کمتر از10 میلیارد ریال)',
    value: 2,
  },
  {
    factor: 'Financial',
    description: 'خسارت متوسط (10–30 میلیارد ریال)',
    value: 3,
  },
  {
    factor: 'Financial',
    description: 'خسارت زیاد (30–60 میلیارد ریال)',
    value: 4,
  },
  {
    factor: 'Financial',
    description:
      'خسارت بسیار زیاد (بیش از 60 میلیارد ریال یا توقف درآمد سرویس)',
    value: 5,
  },
  {
    factor: 'Reputation / Regulatory',
    description: 'بدون اثر بر اعتبار سازمان',
    value: 1,
  },
  {
    factor: 'Reputation / Regulatory',
    description: 'اثر درون‌سازمانی جزئی',
    value: 2,
  },
  {
    factor: 'Reputation / Regulatory',
    description: 'اثر محدود در بین ذی‌نفعان داخلی',
    value: 3,
  },
  {
    factor: 'Reputation / Regulatory',
    description: 'انتشار عمومی منفی یا تذکر نظارتی',
    value: 4,
  },
  {
    factor: 'Reputation / Regulatory',
    description: 'خسارت شدید به اعتبار یا جریمه رسمی',
    value: 5,
  },
  {
    factor: 'Confidentiality',
    description: 'بدون اثر در نقض محرمانگی اطلاعات',
    value: 1,
  },
  {
    factor: 'Confidentiality',
    description: 'داده غیرحساس',
    value: 2,
  },
  {
    factor: 'Confidentiality',
    description: 'افشای بخشی از داده‌های داخلی',
    value: 3,
  },
  {
    factor: 'Confidentiality',
    description: 'افشای داده‌های مشتریان یا تراکنش‌ها',
    value: 4,
  },
  {
    factor: 'Confidentiality',
    description: 'افشای داده‌های حیاتی/حساس (KYC، PIN، ...)',
    value: 5,
  },
  {
    factor: 'Integrity',
    description: 'بدون اثر در نقض صحت داده‌ها',
    value: 1,
  },
  {
    factor: 'Integrity',
    description: 'تغییر جزئی غیرمهم',
    value: 2,
  },
  {
    factor: 'Integrity',
    description: 'اختلال در بخشی از فرآیند/گزارش',
    value: 3,
  },
  {
    factor: 'Integrity',
    description: 'نتایج نادرست/اختلال محسوس',
    value: 4,
  },
  {
    factor: 'Integrity',
    description: 'تصمیمات غلط یا خسارت قانونی/مالی',
    value: 5,
  },
  {
    factor: 'Availability',
    description: 'بدون اثر در نقض دسترس پذیری کلیه سرویس‌ها ',
    value: 1,
  },
  {
    factor: 'Availability',
    description: 'اختلال/ قطعی سرویس‌های غیرحیاتی/ داخلی ',
    value: 2,
  },
  {
    factor: 'Availability',
    description: 'بازیابی سرویس حیاتی یا چند سرویس وابسته بیش از 5 ساعت',
    value: 3,
  },
  {
    factor: 'Availability',
    description: 'بازیابی سرویس حیاتی یا چند سرویس وابسته بین 1 ساعت تا 5 ساعت',
    value: 4,
  },
  {
    factor: 'Availability',
    description: 'بازیابی سرویس حیاتی یا چند سرویس وابسته تا 1 ساعت',
    value: 5,
  },
];

export const AssetScoreSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < assetScores.length; i++) {
    const element = assetScores[i];

    const assetScoringFactor = await datasource
      .getRepository(AssetScoringFactor)
      .findOne({
        where: {
          title: element.factor,
        },
      });

    if (!assetScoringFactor) {
      console.log(element.factor);
      throw new NotFoundException('assetScoringFactor');
    }

    const assetScore = await datasource.getRepository(AssetScore).findOne({
      where: {
        factorId: assetScoringFactor.id,
        value: element.value,
      },
    });

    if (assetScore) {
      continue;
    }

    await datasource.getRepository(AssetScore).save(
      new AssetScore({
        factorId: assetScoringFactor.id,
        description: element.description,
        value: element.value,
      }),
    );
  }

  return true;
};
