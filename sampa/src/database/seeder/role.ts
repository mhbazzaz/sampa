import { NotFoundException } from '@nestjs/common';
import { CategoryEnum } from 'src/common/enums/category.enum';
import { Role } from 'src/role/entities/role.entity';
import { DataSource } from 'typeorm';

const roles: {
  id: string;
  name: string;
  nameFa: string;
  category: CategoryEnum;
  supervisorName?: string;
}[] = [
  {
    id: '029cbdf7-796a-44ff-86e1-97e254d22ec3',
    name: 'ciso',
    nameFa: 'مدیر امنیت',
    category: CategoryEnum.INTERNAL,
  },
  {
    id: '233d6f2c-2fc4-46c7-bcc9-05134d48cc75',
    name: 'applicant manager',
    nameFa: 'مسئول متقاضی',
    category: CategoryEnum.EXTERNAL,
  },
  {
    id: '1eaabf06-ebdd-4ef6-b08c-0cbf1ce4b02c',
    name: 'pke SAM',
    nameFa: 'سرپرست احراز هویت رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '5f2cb46d-c891-4adc-b386-49183a13b9ed',
    name: 'soc SAM',
    nameFa: 'سرپرست لایه عملیات امنیت',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: 'f4f4bb50-a917-4eff-be78-08e8e8730a4a',
    name: 'csa SAM',
    nameFa: 'سرپرست لایه رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '20173f92-ffb8-42bb-90a5-6fe318e28de4',
    name: 'sca SAM',
    nameFa: 'سرپرست لایه سیستم و سرویس',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '4328fa3a-a4cb-42ee-92a7-9349c03c293b',
    name: 'ava SAM',
    nameFa: 'سرپرست لایه برنامه کاربردی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '16a9a62c-6817-4afd-b9ef-018960e78a12',
    name: 'applicant',
    nameFa: 'متقاضی',
    category: CategoryEnum.EXTERNAL,
    supervisorName: 'applicant manager',
  },
  {
    id: '34cd4507-858a-4672-ae7d-0140b3949a01',
    name: 'ava supervisor',
    nameFa: 'ناظر لایه برنامه کاربردی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ava SAM',
  },
  {
    id: '6acd39a0-02d2-4a85-b571-a01a29b4608b',
    name: 'ava auditor',
    nameFa: 'ارزیاب لایه برنامه کاربردی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ava supervisor',
  },
  {
    id: '98b0eee5-5e8f-44d9-83fb-7f6f62a43bca',
    name: 'sca supervisor',
    nameFa: 'ناظر لایه سیستم و سرویس',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'sca SAM',
  },
  {
    id: '9ee58845-82c0-454c-ae73-682275bc628a',
    name: 'sca auditor',
    nameFa: 'ارزیاب لایه سیستم و سرویس',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'sca supervisor',
  },
  {
    id: 'a0483ed4-a39d-4045-93cf-9b52714ff964',
    name: 'csa supervisor',
    nameFa: 'ناظر لایه رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'csa SAM',
  },
  {
    id: 'b7ae37b0-79f8-4636-a6a3-9c9ee7158645',
    name: 'csa auditor',
    nameFa: 'ارزیاب لایه رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'csa supervisor',
  },
  {
    id: 'bb3f93d7-a638-446b-81b9-14f15580180e',
    name: 'soc supervisor',
    nameFa: 'ناظر لایه عملیات امنیت',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'soc SAM',
  },
  {
    id: 'fabd4f19-67ed-4782-a130-262252f2029e',
    name: 'soc auditor',
    nameFa: 'ارزیاب لایه عملیات امنیت',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'soc supervisor',
  },
  {
    id: '49c142e4-5a1d-41e8-9a0a-929b658138d5',
    name: 'pke supervisor',
    nameFa: 'ناظر احراز هویت رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'pke SAM',
  },
  {
    id: '0e1f9a22-fbbe-400a-ab5c-af3059f901aa',
    name: 'pke operator',
    nameFa: 'کارشناس احراز هویت رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'pke supervisor',
  },
  {
    id: 'fcc6c318-3641-4b59-ae09-c4717a82919f',
    name: 'pke auditor',
    nameFa: 'ارزیاب احراز هویت رمزنگاری',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'pke supervisor',
  },
  {
    id: '7b8742f9-fc8f-4bc1-8020-06b0c443deb3',
    name: 'STO',
    nameFa: 'ناظر ارشد امنیت',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
];

export const RoleSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < roles.length; i++) {
    const { supervisorName, ...element } = roles[i];

    let superior: Role | null = null;
    if (supervisorName) {
      superior = await datasource
        .getRepository(Role)
        .findOne({ where: { name: supervisorName } });
      if (!superior) {
        console.log(supervisorName);
        throw new NotFoundException('superior');
      }
    }

    const role = new Role(element);

    await datasource
      .getRepository(Role)
      .save({ ...role, superiorId: superior?.id });
  }

  return true;
};
