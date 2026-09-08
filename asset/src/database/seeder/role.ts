import { NotFoundException } from '@nestjs/common';
import { AssetRoles } from 'src/common/enums/asset-roles.enum';
import { CategoryEnum } from 'src/common/enums/category.enum';
import { Role } from 'src/role/entities/role.entity';
import { DataSource } from 'typeorm';

const roles: {
  id?: string;
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
    category: CategoryEnum.INTERNAL,
  },
  {
    id: '16a9a62c-6817-4afd-b9ef-018960e78a12',
    name: 'applicant',
    nameFa: 'متقاضی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'applicant manager',
  },
  {
    id: '98b0eee5-5e8f-44d9-83fb-7f6f62a43bca',
    name: 'sca supervisor',
    nameFa: 'ناظر لایه سیستم و سرویس',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: 'c167db60-a093-40b7-bf7d-44de3e5c7c8c',
    name: 'sca operator',
    nameFa: 'کارشناس لایه سیستم و سرویس',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'sca supervisor',
  },
  {
    id: 'bb3f93d7-a638-446b-81b9-14f15580180e',
    name: 'soc supervisor',
    nameFa: 'ناظر لایه عملیات امنیت',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '5ccbd7c6-f3de-46c6-9022-7dddb06b8170',
    name: 'soc operator',
    nameFa: 'کارشناس لایه عملیات امنیت',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'soc supervisor',
  },
  {
    id: 'fc58c6c5-3ad5-4c6b-b62f-5ea4feb27b46',
    name: 'opr supervisor',
    nameFa: 'ناظر عملیات',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '9d5206c5-3c0e-4331-87d6-88d26175d60e',
    name: 'opr operator',
    nameFa: 'کارشناس عملیات',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'opr supervisor',
  },
  {
    id: '4b483900-06ca-455e-9158-5aa411b1d9a6',
    name: 'net supervisor',
    nameFa: 'ناظر شبکه',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: 'fffdb2c9-3f8e-4de2-9766-301d9214e9bd',
    name: 'net operator',
    nameFa: 'کارشناس شبکه',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'net supervisor',
  },
  {
    id: '43619fc0-a631-40b4-ab2f-1fe75e1a059e',
    name: 'dev supervisor',
    nameFa: 'ناظر توسعه نرم‌افزار',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '4591ffca-73a3-4f85-bd1e-d80cd63eec34',
    name: 'dev operator',
    nameFa: 'کارشناس توسعه نرم‌افزار',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'dev supervisor',
  },
  {
    id: '49063227-91a4-44de-9be9-e6d80f5dd044',
    name: AssetRoles.AssetSupervisor,
    nameFa: 'مدیر دارایی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '98d1cedd-7063-4ac3-a95e-7ef9b9297eb7',
    name: AssetRoles.AssetUser,
    nameFa: 'کارشناس دارایی',
    category: CategoryEnum.INTERNAL,
    supervisorName: AssetRoles.AssetSupervisor,
  },
  {
    id: '49f1817c-37e6-4c94-a2fb-8b98c0366658',
    name: AssetRoles.AssetAuditor,
    nameFa: 'ممیز دارایی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '3026469a-a105-4747-b4c2-1819d70ca441',
    name: AssetRoles.AssetAdministrator,
    nameFa: 'راهبر دارایی',
    category: CategoryEnum.INTERNAL,
    supervisorName: 'ciso',
  },
  {
    id: '2a640473-3733-47a4-9d71-bb5bfaf8d331',
    name: AssetRoles.LSWAdmin,
    nameFa: 'مدیر لاگ سورس',
    category: CategoryEnum.INTERNAL,
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

    const record = await datasource.getRepository(Role).findOne({
      where: {
        name: element.name,
        category: element.category,
        superiorId: superior?.id,
      },
    });
    if (record) {
      continue;
    }
    const role = new Role(element);

    await datasource
      .getRepository(Role)
      .save({ ...role, superiorId: superior?.id });
  }

  return true;
};
