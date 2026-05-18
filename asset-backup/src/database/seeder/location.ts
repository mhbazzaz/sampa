import { NotFoundException } from '@nestjs/common';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { Location } from 'src/location/entities/location.entity';
import { DataSource } from 'typeorm';

const locations: {
  id: string;
  name: string;
  code: string;
  exCode: string;
  address: string;
  parentId: string | null;
  locationType: string;
}[] = [
  {
    id: 'a05e4f61-3a8d-4f83-8337-adecb474b680',
    name: 'ظفر',
    code: 'ZFR',
    exCode: 'ZFR',
    address: 'تهران، خ وحید دستگردی، شماره 125',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: '9ccd2ba5-adba-4037-b45b-37ac1739a9bd',
    name: 'جمهوری',
    code: 'JMH',
    exCode: 'JMH',
    address: 'تهران، خ جمهوری',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: '68cf1114-4e6d-4f79-8a36-f9f58e93843e',
    name: 'فردوسی',
    code: 'FRD',
    exCode: 'FRD',
    address: 'تهران، خ فردوسی، تقاطع خ جمهوری',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: '63966e2c-5099-449e-9dd4-e7a0d0dfa017',
    name: 'مهاجر',
    code: 'MHJ',
    exCode: 'MHJ',
    address: 'تهران، بلوار میرداماد، محوطه بانک مرکزی، مجاور ساختمان شنگرف',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: '8ea87faf-a8f0-4c00-9ccd-a739e724b05c',
    name: 'کیش',
    code: 'KSH',
    exCode: 'KSH',
    address: 'هرمزگان، کیش',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: '154c2132-c2c0-49d3-9808-77925508ee46',
    name: 'نوشهر',
    code: 'NSH',
    exCode: 'NSH',
    address: 'مازندران، نوشهر، چلندر، مجتمع بانک مرکزی',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    name: 'داوودیه',
    code: 'DAV',
    exCode: 'DAV',
    address: 'تهران، بلوار میرداماد، محوطه بانک مرکزی',
    parentId: null,
    locationType: 'Main Site',
  },
  {
    id: 'fd536317-51d6-4aa7-9bb5-712781fb045e',
    name: 'Dav-Security vCenter',
    code: 'Dav-Security',
    exCode: 'Dav-Security',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: '86128957-58a0-459f-8d0c-bbf75c2c40d1',
    name: 'Nasim-Backup-Ferdousi vCenter',
    code: 'Nasim-Backup-Ferdousi',
    exCode: 'Nasim-Backup-Ferdousi',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: '0ca6014f-b233-496e-8ae7-d7db1233ce7b',
    name: 'Hafez-Hakemiyati-Backup vCenter',
    code: 'Hafez-Hakemiyati-Backup',
    exCode: 'Hafez-Hakemiyati-Backup',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: 'f52ef249-bfd6-4a22-bd6c-127d3c15555e',
    name: 'Hakemiyati-B3 vCenter',
    code: 'Hakemiyati-B3',
    exCode: 'Hakemiyati-B3',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: '88ad755d-ad3a-4b9b-86db-dd734b837929',
    name: 'Nezarat-B3 vCenter',
    code: 'Nezarat-B3',
    exCode: 'Nezarat-B3',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: 'd334655a-f4b7-481e-8a94-439686f42882',
    name: 'Nasim-B3 vCenter',
    code: 'Nasim-B3',
    exCode: 'Nasim-B3',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: 'edc3b5b9-5509-4463-a422-7c6571e802b7',
    name: 'FAASH vCenter',
    code: 'FAASH',
    exCode: 'FAASH',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: 'c0893eb2-fcfc-4a5b-8c7f-d5cf1b9fb05a',
    name: 'NPS-Vaset vCenter',
    code: 'NPS-Vaset',
    exCode: 'NPS-Vaset',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: 'c546c593-0fea-4e8f-a9a2-4238b2aec0d4',
    name: 'NPS vCenter',
    code: 'NPS',
    exCode: 'NPS',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: '0a80bb67-b8f8-476c-a898-4fed875f4783',
    name: 'Ferdowsi vCenter',
    code: 'Ferdowsi',
    exCode: 'Ferdowsi',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: 'fe16dfee-d2f6-4707-8578-4d67013b21a8',
    name: 'Kish vCenter',
    code: 'Kish',
    exCode: 'Kish',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: '7cec7e52-49c1-46d5-be9f-17473c167400',
    name: 'Banking-Service-Oper vCenter',
    code: 'Banking-Service-Oper',
    exCode: 'Banking-Service-Oper',
    address: 'vCenter',
    parentId: null,
    locationType: 'vCenter',
  },
  {
    id: '09520517-e5c1-40af-8b96-983521f724bf',
    name: 'Noshahr CDC',
    code: 'NCDC',
    exCode: 'NSH:CDC',
    address: 'مرکز داده کارت نوشهر',
    parentId: '154c2132-c2c0-49d3-9808-77925508ee46',
    locationType: 'Data Center',
  },
  {
    id: 'ce5bad7b-4aeb-493d-93fb-30ffd8f01359',
    name: 'Noshahr NPS',
    code: 'NNPS',
    exCode: 'NSH:NPS',
    address: 'سایت پرداختهای ملی نوشهر',
    parentId: '154c2132-c2c0-49d3-9808-77925508ee46',
    locationType: 'Data Center',
  },
  {
    id: 'bd75ae40-4c11-4c78-8f50-5972acee3ab8',
    name: 'Noshahr NCC',
    code: 'NNCC',
    exCode: 'NSH:NCC',
    address: 'مرکز کنترل شبکه نوشهر',
    parentId: '154c2132-c2c0-49d3-9808-77925508ee46',
    locationType: 'Data Center',
  },
  {
    id: '487714b0-1b03-43c6-aa92-c9511e6b5260',
    name: 'Jomhoori Shafagh',
    code: 'JSHF',
    exCode: 'JMH:SHF',
    address: 'سایت شفق جمهوری',
    parentId: '9ccd2ba5-adba-4037-b45b-37ac1739a9bd',
    locationType: 'Data Center',
  },
  {
    id: '468865dd-5cd9-4047-9ed4-71ce74b68cb2',
    name: 'Kish CDC',
    code: 'KCDC',
    exCode: 'KSH:CDC',
    address: 'مرکز داده کارت کیش',
    parentId: '8ea87faf-a8f0-4c00-9ccd-a739e724b05c',
    locationType: 'Data Center',
  },
  {
    id: 'ae754609-3b4c-43a0-a954-a675657a6014',
    name: 'Ferdosi NPS',
    code: 'FNPS',
    exCode: 'FRD:NPS',
    address: 'سایت پرداختهای ملی فردوسی',
    parentId: '68cf1114-4e6d-4f79-8a36-f9f58e93843e',
    locationType: 'Data Center',
  },
  {
    id: '0e027374-c68c-4485-b98d-a4cd77db34dd',
    name: 'Kish NCC',
    code: 'KNCC',
    exCode: 'KSH:NCC',
    address: 'مرکز کنترل شبکه کیش',
    parentId: '8ea87faf-a8f0-4c00-9ccd-a739e724b05c',
    locationType: 'Data Center',
  },
  {
    id: '2dd4c1f2-9a6d-4b90-a620-6b69d753ed53',
    name: 'Davoudiye CDC',
    code: 'DCDC',
    exCode: 'DAV:CDC',
    address: 'مرکز داده کارت داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '799637b0-c91e-4535-bdd8-ceea09395e32',
    name: 'بانک ملی',
    code: 'DBMI',
    exCode: 'DAV:BMI',
    address: 'سایت بانک ملی داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '850b45db-c815-4d1a-b72c-c8ed452ebdae',
    name: 'Davoudiye Aquarium',
    code: 'DAQU',
    exCode: 'DAV:AQU',
    address: 'سایت آکواریوم داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: 'ab53b18a-aa0e-4fcd-9f2a-a99b96e3b708',
    name: 'Davoudiye NPS',
    code: 'DNPS',
    exCode: 'DAV:NPS',
    address: 'سایت پرداختهای ملی داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '12b6a47e-e1b0-4c99-8c80-851ae7b94ea7',
    name: 'Davoudiye IDC',
    code: 'DIDC',
    exCode: 'DAV:IDC',
    address: 'مرکز داده اینترنت داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '831f6344-db17-42c6-814a-51b15fe5db65',
    name: 'Davoudiye NCC',
    code: 'DNCC',
    exCode: 'DAV:NCC',
    address: 'مرکز کنترل شبکه داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '6f42d4b3-dc22-4719-b2fd-8747c98b7ea0',
    name: 'Davoudiye B3-1',
    code: 'DB31',
    exCode: 'DAV:B3-1',
    address: 'سایت منفی سه قدیم داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: 'c6d53782-4db0-4e58-a683-4cf1df7522bc',
    name: 'Davoudiye B3-2',
    code: 'DB32',
    exCode: 'DAV:B3-2',
    address: 'سایت منفی سه جدید داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: 'f7f475d9-4709-471c-ab00-1e2533e51699',
    name: 'Davoudiye Shangarf',
    code: 'DSHN',
    exCode: 'DAV:SHN',
    address: 'سایت شنگرف داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '58b5379e-8961-4bf6-b7a3-84153114a3b5',
    name: 'Davoudiye Imen',
    code: 'DIMN',
    exCode: 'DAV:IMN',
    address: 'سایت ایمن داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: 'ee97119b-5728-40b4-93d3-421975e3013e',
    name: 'Davoudiye RF',
    code: 'DRF',
    exCode: 'DAV:RF',
    address: 'سایت فرکانس رادیویی داوودیه',
    parentId: 'd57274e3-5150-4134-a5fa-32978b4ee512',
    locationType: 'Data Center',
  },
  {
    id: '1d7b938c-1cf2-4992-83cd-b476fcf90788',
    name: 'Ferdosi NCC',
    code: 'FNCC',
    exCode: 'FRD:NCC',
    address: 'مرکز کنترل شبکه فردوسی',
    parentId: '68cf1114-4e6d-4f79-8a36-f9f58e93843e',
    locationType: 'Data Center',
  },
  {
    id: '80c148f5-f1a4-41c7-a626-e217468a9c99',
    name: 'Ferdosi CDC',
    code: 'FCDC',
    exCode: 'FRD:CDC',
    address: 'مرکز داده کارت فردوسی',
    parentId: '68cf1114-4e6d-4f79-8a36-f9f58e93843e',
    locationType: 'Data Center',
  },
  {
    id: '853ee9d8-f535-496a-b347-7ec347c03928',
    name: 'Ferdosi Hafez',
    code: 'FHFZ',
    exCode: 'FRD:HFZ',
    address: 'سایت حافظ فردوسی',
    parentId: '68cf1114-4e6d-4f79-8a36-f9f58e93843e',
    locationType: 'Data Center',
  },
  {
    id: 'd721589a-73ae-4d00-8519-56fe2238656e',
    name: 'Ferdosi DAD',
    code: 'FDAD',
    exCode: 'FRD:DAD',
    address: 'سایت داده آمایی فردوسی',
    parentId: '68cf1114-4e6d-4f79-8a36-f9f58e93843e',
    locationType: 'Data Center',
  },
  {
    id: '4d92dc6b-11ba-4ad6-945c-2b573a67f02a',
    name: 'Ferdosi RF',
    code: 'FRF',
    exCode: 'FRD:RF',
    address: 'سایت فرکانس رادیویی فردوسی',
    parentId: null,
    locationType: 'Data Center',
  },
  {
    id: '63517580-16aa-4f93-8428-83c66b6651c1',
    name: 'Kish NPS',
    code: 'KNPS',
    exCode: 'KSH:NPS',
    address: 'سایت پرداختهای ملی کیش',
    parentId: '8ea87faf-a8f0-4c00-9ccd-a739e724b05c',
    locationType: 'Data Center',
  },
];

export const LocationSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < locations.length; i++) {
    const element = locations[i];

    const location = await datasource.getRepository(Location).findOne({
      where: [
        {
          name: element.name,
        },
        { id: element.id },
      ],
    });

    if (location) {
      if (location.id !== element.id) {
        console.log(
          `location-type id does not match ${JSON.stringify({
            location: location.id,
            id: element.id,
            name: element.name,
          })}`,
        );
      }
      continue;
    }

    const locationType = await datasource
      .getRepository(LocationType)
      .findOne({ where: { name: element.locationType } });
    if (!locationType) {
      console.log(element.name);
      throw new NotFoundException(element.name);
    }

    await datasource.getRepository(Location).save(
      new Location({
        ...element,
        locationType: undefined,
        locationTypeId: locationType.id,
      }),
    );
  }

  return true;
};
