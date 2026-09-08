import { AssessmentType } from 'src/assessment/entities/assessment-type.entity';
import { DataSource } from 'typeorm';

const assessmentTypes = [
  {
    name: 'ava',
    description: 'برنامه کاربردی',
  },
  {
    name: 'sca',
    description: 'سیستم و سرویس',
  },
  {
    name: 'csa',
    description: 'احراز هویت رمزنگاری',
  },
  {
    name: 'soc',
    description: 'عملیات امنیت',
  },
];

export const AssessmentTypeSeeder = async (datasource: DataSource) => {
  const oldAssessmentType = await datasource
    .getRepository(AssessmentType)
    .find();
  for (let i = 0; i < oldAssessmentType.length; i++) {
    const element = oldAssessmentType[i];
    const fi = assessmentTypes.findIndex(
      (assessmentType) =>
        assessmentType.name === element.name &&
        assessmentType.description === element.description,
    );

    if (fi === -1) {
      try {
        await datasource.getRepository(AssessmentType).remove(element);
      } catch (error) {
        console.log('could not delete', error);
      }
    }
  }

  for (let i = 0; i < assessmentTypes.length; i++) {
    const element = assessmentTypes[i];

    const record = await datasource.getRepository(AssessmentType).findOne({
      where: {
        name: element.name,
        description: element.description,
      },
    });
    if (record) {
      continue;
    }

    await datasource.getRepository(AssessmentType).save(element);
  }

  return true;
};
