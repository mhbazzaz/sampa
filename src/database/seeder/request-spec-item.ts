import { RequestSpecItem } from 'src/spec/entities/request-spec-item.entity';
import { DataSource } from 'typeorm';

const requestSpecItems: {
  id: string;
  value: string;
  isMultiValue: boolean;
  isOptional: boolean;
  assetTypeId: string;
  environmentId: string;
  name: string;
  description: string;
}[] = [
  {
    id: '9d0a9c6e-f8f9-419a-930a-1dc638f33b33',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"تصدیق هویت"},"properties":{"communicationFactors":{"type":"string","minLength":1,"metadata":{"title":"عوامل ارتباط"}},"direction":{"type":"string","metadata":{"title":"جهت"}},"method":{"type":"string","metadata":{"title":"روش"}},"technology":{"type":"string","metadata":{"title":"تکنولوژی"}},"relatedStandards":{"type":"string","metadata":{"title":"استاندارد های مرتبط"}}},"required":["communicationFactors"]}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'authentication',
    description: 'تصدیق هویت',
  },
  {
    id: '42ade5c8-aed6-4601-b9ca-7dab0578d764',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"مدیریت کلید"},"properties":{"keyManagement":{"type":"array","metadata":{"title":"مدیریت کلید","type":"table"},"items":{"type":"object","properties":{"keyType":{"type":"string","metadata":{"title":"نوع کلید"}},"keyUse":{"type":"string","metadata":{"title":"کاربرد کلید"}},"keyProduction":{"type":"string","metadata":{"title":"تولید کلید"}},"keyBackup":{"type":"string","metadata":{"title":"پشتیبان گیری کلید"}},"keyDistribution":{"type":"string","metadata":{"title":"توزیع کلید"}},"keyInjection":{"type":"string","metadata":{"title":"تزریق کلید"}},"keyExpiration":{"type":"string","format":"date","metadata":{"title":"انقضاء کلید"}},"keyLifetime":{"type":"string","metadata":{"title":"طول عمر"}}}}}}}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'keyManagement',
    description: 'مدیریت کلید',
  },
  {
    id: 'ee64e8d0-aac0-4b71-94df-cbc3c6bc36da',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"شرح مأموریت"},"properties":{"description":{"type":"string","metadata":{"title":"شرح فرآیند","type":"textarea"}},"actor":{"type":"array","metadata":{"title":"کنشگر","type":"table"},"items":{"type":"object","properties":{"actorRole":{"type":"string","metadata":{"title":"نقش کنشگر"}},"actorType":{"type":"string","enum":["Individual","System"],"metadata":{"title":"نوع کنشگر","enumLabels":["شخص","سیستم"]}}}}},"diagram":{"type":"string","metadata":{"title":"نمودار کاربرد","type":"file"}}},"required":["actor"]}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'missionDescription',
    description: 'شرح مأموریت',
  },
  {
    id: '95270763-8e08-43a0-9744-0f00806b98cb',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"دسترسی های لازم جهت انجام تست نفوذ"},"properties":{"application":{"type":"array","metadata":{"title":"برنامه کاربردی","type":"table"},"items":{"type":"object","properties":{"URL":{"type":"string","pattern":"^(https?|ftp)://[\\\\w.-]+\\\\.[a-zA-Z]{2,}([:/?#][^\\\\s]*)?$|^$","metadata":{"title":"URL"}},"username":{"type":"string","metadata":{"title":"Username"}},"password":{"type":"string","metadata":{"title":"Password"}},"component":{"type":"string","metadata":{"title":"مؤلفه"}}}}},"serviceOrAPI":{"type":"array","metadata":{"title":"سرویس/API","type":"table"},"items":{"type":"object","properties":{"serviceName":{"type":"string","metadata":{"title":"نام سرویس"}},"IP":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"IP"}},"port":{"type":"string","pattern":"^(6553[0-5]|655[0-2][0-9]|64[0-9]{3}|[1-5]?[0-9]{1,4})$|^$","metadata":{"title":"Port"}},"username":{"type":"string","metadata":{"title":"Username"}},"password":{"type":"string","metadata":{"title":"Password"}},"path":{"type":"string","pattern":"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:/[a-zA-Z0-9_\\\\-\\\\/]+)?$|^(?:[a-f0-9]{1,4}:){7}[a-f0-9]{1,4}(?:/[a-zA-Z0-9_\\\\-\\\\/]+)?$|^$","metadata":{"title":"Path"}}}}},"operatingSystem":{"type":"array","metadata":{"title":"سیستم عامل","type":"table"},"items":{"type":"object","properties":{"connectionType":{"type":"string","enum":["SSH","FTP"],"metadata":{"title":"نوع ارتباط","enumLabels":["SSH","FTP"]}},"IP":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"IP"}},"port":{"type":"string","pattern":"^(6553[0-5]|655[0-2][0-9]|64[0-9]{3}|[1-5]?[0-9]{1,4})$|^$","metadata":{"title":"Port"}},"username":{"type":"string","metadata":{"title":"Username"}},"password":{"type":"string","metadata":{"title":"Password"}}}}},"network":{"type":"array","metadata":{"title":"شبکه","type":"table"},"items":{"type":"object","properties":{"physicalLocation":{"type":"string","metadata":{"title":"محل فیزیکی"}},"site":{"type":"string","metadata":{"title":"سایت"}},"rackNumber":{"type":"string","metadata":{"title":"شماره رک"}},"switchNumber":{"type":"string","metadata":{"title":"شماره سوییچ"}},"portNumberInSwitch":{"type":"string","pattern":"^(6553[0-5]|655[0-2][0-9]|64[0-9]{3}|[1-5]?[0-9]{1,4})$|^$","metadata":{"title":"شماره پورت در سوئیچ"}},"IP":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"IP"}},"subnet":{"type":"string","pattern":"^(255\\\\.(255|254|252|248|240|224|192|128|0)\\\\.(255|254|252|248|240|224|192|128|0)\\\\.(255|254|252|248|240|224|192|128|0)|255\\\\.255\\\\.255\\\\.255)$|^$","metadata":{"title":"Subnet"}},"gateway":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"Gateway"}}}}},"testInformation":{"type":"array","metadata":{"title":"اطلاعات تست","type":"table"},"items":{"type":"object","properties":{"item":{"type":"string","metadata":{"title":"آیتم"}},"amount":{"type":"string","metadata":{"title":"مقدار"}},"area":{"type":"string","metadata":{"title":"محدوده"}}}}}}}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'penetrationTestAccessRequirements',
    description: 'دسترسی های لازم جهت انجام تست نفوذ',
  },
  {
    id: 'b1fb5bfa-7015-458b-ac12-1d9e412d8ca7',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"محدوده سرویس"},"properties":{"hardwareEquipments":{"type":"array","metadata":{"title":"تجهیزات سخت افزاری","type":"table"},"items":{"type":"object","properties":{"technicalEquipmentsSpecs":{"type":"string","metadata":{"title":"مشخصات تجهیزات فنی"}},"installationLocation":{"type":"string","metadata":{"title":"محل نصب"}},"IPAddress":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"IP آدرس"}},"description":{"type":"string","metadata":{"title":"توضیحات"}}}}},"connectionLinks":{"type":"array","minItems":1,"metadata":{"title":"لینک های ارتباطی","type":"table"},"items":{"type":"object","properties":{"connectionLinkName":{"type":"string","minLength":1,"metadata":{"title":"نام لینک ارتباطی"}},"linkBeginning":{"type":"string","metadata":{"title":"ابتدای لینک"}},"linkEnding":{"type":"string","metadata":{"title":"انتهای لینک"}},"linkType":{"type":"string","metadata":{"title":"نوع لینک"}},"linkBandWidth":{"type":"string","pattern":"^(\\\\d+(\\\\.\\\\d+)?)(bps|Kbps|Mbps|Gbps)$|^$","metadata":{"title":"پهنای باند لینک"}},"linkOwnership":{"type":"string","metadata":{"title":"مالکیت لینک"}}},"required":["connectionLinkName"]}},"softwareComponents":{"type":"array","minItems":1,"metadata":{"title":"مؤلفه های نرم افزاری","type":"table"},"items":{"type":"object","properties":{"softwareName":{"type":"string","metadata":{"title":"نام نرم افزار"}},"producerCompany":{"type":"string","metadata":{"title":"شرکت تولید کننده"}},"technology":{"type":"string","metadata":{"title":"تکنولوژِی"}},"architecture":{"type":"string","metadata":{"title":"معماری"}},"mission":{"type":"string","metadata":{"title":"مأموریت"}},"usedServices":{"type":"string","minLength":1,"metadata":{"title":"سرویس های مورد استفاده"}}},"required":["usedServices"]}},"stabilityFoundation":{"type":"array","minItems":1,"metadata":{"title":"بستر استقرار","type":"table"},"items":{"type":"object","properties":{"usedService":{"type":"string","minLength":1,"metadata":{"title":"سرویس استفاده شده"}},"operatingSystem":{"type":"string","metadata":{"title":"سیستم عامل"}},"IPAddress":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"IP آدرس"}},"serviceName":{"type":"string","minLength":1,"metadata":{"title":"نام سرویس"}},"version":{"type":"string","metadata":{"title":"نسخه"}},"componentsUsingService":{"type":"string","metadata":{"title":"مؤلفه های استفاده کننده از سرویس"}}},"required":["usedService","serviceName"]}},"network":{"type":"string","metadata":{"title":"شبکه","type":"file"}},"stabilityDiagram":{"type":"string","metadata":{"title":"نمودار استقرار","type":"file"}},"encryptedConnections":{"type":"array","metadata":{"title":"ارتباطات رمزنگاری شده","type":"table"},"items":{"type":"object","properties":{"fromService":{"type":"string","metadata":{"title":"از سرویس/مؤلفه"}},"toService":{"type":"string","metadata":{"title":"به سرویس/مؤلفه"}},"IPAddress":{"type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"title":"IP آدرس"}},"encryptionProtocol":{"type":"string","metadata":{"title":"پروتکل رمزنگاری"}},"protocolDetails":{"type":"string","metadata":{"title":"جزئیات پروتکل"}}}}}},"required":["connectionLinks","softwareComponents","stabilityFoundation"]}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'serviceArea',
    description: 'محدوده سرویس',
  },
  {
    id: '2ed87a2c-4266-4787-b79b-e5b29a9e0ab9',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"رویدادنگاری"},"properties":{"SOC":{"type":"array","metadata":{"title":"رویدادنگاری","type":"table"},"items":{"type":"object","properties":{"layer":{"type":"string","metadata":{"title":"لایه"}},"eventType":{"type":"string","metadata":{"title":"نوع رویداد"}},"eventRecordDetails":{"type":"string","metadata":{"title":"محتویات رکورد رویداد"}},"keyStorageLocation":{"type":"string","metadata":{"title":"محل ذخیره کلید"}},"inspections":{"type":"string","metadata":{"title":"ملاحظات"}}}}}}}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'soc',
    description: 'رویدادنگاری',
  },
  {
    id: '36a1a56d-9a1c-4ef7-904d-ead147109d75',
    value:
      '{"$schema":"http://json-schema.org/schema#","description":"Comment describing your JSON Schema","type":"object","properties":{"details":{"type":"object","metadata":{"title":"داده های محرمانه"},"properties":{"dataPrivacy":{"type":"array","metadata":{"title":"محرمانگی داده ها","type":"table"},"items":{"type":"object","properties":{"dataType":{"type":"string","metadata":{"title":"نوع داده"}},"privacyLevel":{"type":"string","enum":["private","sensitive","normal"],"metadata":{"title":"سطح محرمانگی","enumLabels":["محرمانه","حساس","عادی"]}},"encryptionMethod":{"type":"string","enum":["symmetric","asymmetric"],"metadata":{"title":"روش رمزنگاری","enumLabels":["متقارن","نامتقارن"]}},"dataStorageLocation":{"type":"string","enum":["file","database","hsm","vault"],"metadata":{"title":"مکان ذخیره سازی","enumLabels":["file","database","hsm","vault"]}},"keyStorageLocation":{"type":"string","enum":["file","hsm"],"metadata":{"title":"مکان ذخیره سازی کلید","enumLabels":["file","hsm"]}}}}}}}}}',
    isMultiValue: true,
    isOptional: true,
    assetTypeId: '6321f22e-0bac-4925-9326-74d34015159a',
    environmentId: 'a78d084f-0a4a-48d5-95e2-7b0e03470a30',
    name: 'dataPrivacy',
    description: 'داده های محرمانه',
  },
];

export const RequestSpecItemSeeder = async (datasource: DataSource) => {
  for (let i = 0; i < requestSpecItems.length; i++) {
    const element = requestSpecItems[i];

    const record = await datasource.getRepository(RequestSpecItem).findOne({
      where: {
        id: element.id,
        value: element.value,
        isMultiValue: element.isMultiValue,
        isOptional: element.isOptional,
        name: element.name,
        description: element.description,
      },
    });

    if (record) {
      continue;
    }

    await datasource.getRepository(RequestSpecItem).save(element);
  }

  return true;
};
