import { NotFoundException } from '@nestjs/common';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { DataSource } from 'typeorm';

const assetTypes: {
  id: string;
  name: string;
  code: string;
  iconPath: string | null;
  assetCategoryId: string;
  assetTypeVersion: {
    id: string;
    content: string;
    archived: false;
    hasLocation: boolean;
    locationTypeNames?: string[];
    locationTypes?: LocationType[];
    version: number;
  };
}[] = [
  {
    id: '2cb6aa8d-2471-495c-96bf-db423c33477f',
    code: 'OSY',
    name: 'Operating System',
    iconPath: '1754568171627-windows.png',
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    assetTypeVersion: {
      id: '70fd0d75-d5d5-4f80-90a2-67db0860c856',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Operating System","description":"Operating System specifications","type":"object","properties":{"Type":{"description":"The type of the Operating System","type":"string","metadata":{"isSearchable":true}},"Version":{"description":"The version of the Operating System","type":"string","metadata":{"isSearchable":true}},"Installations":{"type":"object","properties":{"InitialInstallationDate":{"type":"string","format":"date"},"Updates":{"description":"All update and patches","type":"array","items":{"type":"object","properties":{"PackageIdentifer":{"description":"Update version or package","type":"string"},"UpdateDate":{"description":"Date update applied","type":"string","format":"date"}}}}}},"FileSystem":{"type":"object","properties":{"Type":{"type":"string","enum":["FAT32","EXT3","EXT4","NTFS","XFS"]},"Partitions":{"type":"object","properties":{"VolumeIdentifier":{"type":"string"},"Capacity":{"description":"Partition capacity (MB)","type":"integer"}}}}},"Services":{"type":"array","items":{"type":"object","properties":{"ServiceName":{"type":"string"},"Status":{"type":"string","enum":["Active","Disabled"]},"StartupSetting":{"type":"string","enum":["Automatic","Manual"]}}}},"InstallationAndUpdateDates":{"type":"object","properties":{"InstallationDate":{"description":"Initial installation date","type":"string","format":"date"},"LastUpdateDate":{"description":"Date of the last update","type":"string","format":"date"}}}}}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '6577b3a1-0ac4-424b-805a-3f8f97ff272f',
    code: 'HYP',
    name: 'Hypervisor',
    iconPath: '1754568040595-hypervisor.png',
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    assetTypeVersion: {
      id: 'a88acea1-318a-4079-a200-92d4c586a2a7',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Hypervisor","description":"Hypervisor asset specifications","type":"object","properties":{"Type":{"description":"The type of the hypervisor","type":"string","metadata":{"isSearchable":true}},"Version":{"description":"The version of the hypervisor","type":"string","metadata":{"isSearchable":true}}}}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '96609507-e327-4e0a-ab32-7956eac4da19',
    code: 'VMC',
    name: 'VM',
    iconPath: '1754829416223-vm.png',
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    assetTypeVersion: {
      id: '4749d247-d4f7-4dae-8859-4dd8022e7afb',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"VM","description":"VM asset specifications","type":"object","properties":{"Services":{"type":"array","items":{"type":"object","properties":{"ServiceName":{"type":"string"},"Status":{"type":"string","enum":["Active","Disabled"]},"StartupSetting":{"type":"string","enum":["Automatic","Manual"]}}}},"Network":{"description":"Details about IP addresses","type":"object","properties":{"IP":{"type":"array","metadata":{"isSearchable":true},"items":{"type":"string","description":"IP address","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"}}}},"CPU":{"description":"CPU allocation details","type":"object","properties":{"Cores":{"description":"Number of CPU cores allocated","type":"integer"},"FrequencyGHz":{"description":"CPU frequency in GHz","type":"integer"}}},"RAM":{"description":"RAM allocation details","type":"object","properties":{"AllocatedGB":{"description":"Allocated RAM in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"UsedGB":{"description":"Used RAM in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}}},"Storage":{"description":"Storage configuration","type":"object","properties":{"AllocatedGB":{"description":"Total storage in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"UsedGB":{"description":"Used storage in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}}},"State":{"type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}},"HostName":{"type":"string","pattern":"^(?!.*?[@!#$%^&*()+=])(?!.*?\\\\.\\\\.)(?!.*?--)[a-zA-Z0-9][a-zA-Z0-9\\\\-\\\\.\\\\/]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$|^$"}}}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['vCenter'],
      version: 1,
    },
  },
  {
    id: 'c752d1dc-ffaf-4932-941f-fe88fa860308',
    code: 'ESX',
    name: 'ESXi',
    iconPath: '1754568076702-esxi.png',
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    assetTypeVersion: {
      id: '4f1b48ff-5992-477e-b63a-3ec60d4915d9',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"ESXi","description":"ESXi specifications","type":"object","properties":{"Version":{"description":"The version of the ESXi","type":"string","metadata":{"isSearchable":true}}}}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: 'cc7db53b-fbb0-4077-ba2c-d759ffc7fb69',
    code: 'MFC',
    name: 'Mainframe CPU',
    iconPath: '1754567886416-chip.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    assetTypeVersion: {
      id: '4a8da347-a561-456d-a87e-b07e75cdae8e',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Mainframe CPU","description":"Mainframe CPU asset specifications","type":"object","properties":{"Model":{"description":"Model and brand of the CPU","type":"string"},"SerialNumber":{"description":"Model and brand of the CPU","type":"string"},"RAM":{"description":"RAM allocation details","type":"object","minProperties":1,"properties":{"AllocatedGB":{"description":"Allocated RAM in GB","type":"integer","minimum":1},"UsedGB":{"description":"Used RAM in GB","type":"integer"}},"required":["AllocatedGB"]},"CPU":{"type":"object","properties":{"Cores":{"description":"CPU cores","type":"integer"},"Frequency":{"description":"CPU frequency","type":"string"}}}}}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Data Center', 'Main Site'],
      version: 1,
    },
  },
  {
    id: 'cca3a3df-632b-4229-acd9-ed3bdb03b4bb',
    code: 'MFS',
    name: 'Mainframe Storage',
    iconPath: '1754568922273-storage.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    assetTypeVersion: {
      id: 'dfd8f1b9-a5fd-4a35-8d62-f7bc6e73ce13',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Mainframe Storage","description":"Mainframe Storage asset specifications","type":"object","properties":{"Model":{"description":"Model and brand of the storage","type":"string"},"SerialNumber":{"description":"Model and brand of the storage","type":"string"},"Capacity":{"description":"Model and brand of the storage","type":"string"}}}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Data Center', 'Main Site'],
      version: 1,
    },
  },
  {
    id: 'd624dbb3-31c1-48dd-a61e-3c6ce3155451',
    code: 'SRV',
    name: 'Server',
    iconPath: '1754568822303-server.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    assetTypeVersion: {
      id: '854689d7-6cf7-4202-9063-56f152be5723',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Server","description":"Server asset specifications","type":"object","properties":{"Model":{"description":"Model and brand of the server, e.g., \'Dell PowerEdge R740\', \'HP ProLiant DL380\'","type":"string"},"ServerType":{"description":"Type of the server (Physical, Virtual, Cloud, Blade)","type":"string","enum":["Physical","Virtual","Cloud","Blade"]},"Network":{"description":"Details about IPs and Mac addresses","type":"object","properties":{"IP":{"type":"array","metadata":{"isSearchable":true},"items":{"type":"string","description":"IP address","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"}},"MacAddress":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"}}},"ManagementIp":{"description":"Management IP address for remote access","type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"RAM":{"description":"RAM allocation details","type":"object","minProperties":1,"properties":{"AllocatedGB":{"description":"Allocated RAM in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$","minLength":1},"UsedGB":{"description":"Used RAM in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}},"required":["AllocatedGB"]},"CPU":{"type":"object","minProperties":1,"properties":{"Cores":{"description":"CPU cores","type":"integer","minimum":1},"Frequency":{"description":"CPU frequency","type":"string"}},"required":["Cores"]},"SerialNumber":{"description":"The serial number of the server","type":"string"},"InstallationAndUpdateDates":{"type":"object","properties":{"InstallationDate":{"description":"Initial installation date","type":"string","format":"date"},"LastUpdateDate":{"description":"Date of the last update","type":"string","format":"date"}}},"HealthStatus":{"type":"object","properties":{"Status":{"description":"Server status (Active, Inactive, Down)","type":"string","enum":["Active","Inactive","Down"]},"Health":{"type":"object","properties":{"Temperature":{"description":"Temperature of the server","type":"string"},"FanSpeed":{"description":"Fan speed","type":"string"},"BatteryStatus":{"description":"Battery status (if using UPS)","type":"string"}}}}},"State":{"type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["RAM","CPU"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site'],
      version: 1,
    },
  },
  {
    id: 'de5784fa-03f4-483f-8512-a6624142157f',
    code: 'STG',
    name: 'Storage',
    iconPath: '1754568922273-storage.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    assetTypeVersion: {
      id: '717da3d0-d08d-4911-9c87-9bc7c6b7a7c9',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Storage","description":"Storage asset specifications","type":"object","properties":{"StorageType":{"description":"Type of the storage device","type":"string","enum":["NAS","SAN","DAS","Flash","HDD","SSD"]},"SerialNumber":{"description":"The serial number of the storage","type":"string"},"Network":{"description":"Details about IPs and Mac addresses","type":"object","properties":{"IP":{"type":"array","metadata":{"isSearchable":true},"items":{"type":"string","description":"IP address","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"}},"MacAddress":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"}}},"Connection":{"description":"Network connection type for storage device","type":"string","enum":["iSCSI","Fibre Channel","NFS","CIFS"]},"ManagementIp":{"description":"Management IP address for remote access","type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Model":{"description":"Model and brand of the storage","metadata":{"isSearchable":true},"type":"string"},"Capacity":{"description":"Model and brand of the storage","type":"string"},"RaidConfiguration":{"description":"RAID configuration details","type":"object","properties":{"RaidLevel":{"description":"RAID level for managing drives and data","type":"string","enum":["RAID 0","RAID 1","RAID 5","RAID 10","RAID 6"]},"DriveCount":{"description":"Number of drives in the RAID group (at least 1)","type":"integer"},"HealthStatus":{"description":"Health status of the RAID configuration","type":"string","enum":["Healthy","Degraded","Failure"]}}},"InstallationAndUpdateDates":{"type":"object","properties":{"InstallationDate":{"description":"Initial installation date","type":"string","format":"date"},"LastUpdateDate":{"description":"Date of the last update","type":"string","format":"date"}}},"State":{"type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}}}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Data Center', 'Main Site'],
      version: 1,
    },
  },
  {
    id: 'eb35af05-3d4f-4bda-9421-b4fd144ed562',
    code: 'CLT',
    name: 'Cluster',
    iconPath: '1754568122475-network.png',
    assetCategoryId: '7f579eb8-f716-4299-ad49-76c3e4b88d5d',
    assetTypeVersion: {
      id: 'efa4e6ca-6d05-4709-9d75-da18ee7302db',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Cluster","description":"Cluster specifications","type":"object","properties":{"Name":{"description":"The type of the Cluster","type":"string","metadata":{"isSearchable":true}}}}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '115f0aba-fffe-4e2d-8ab6-d3e14fd3c6a1',
    code: 'CLI',
    name: 'Client',
    iconPath: null,
    // 'files/assetType/icons/1768121189418-icons8-windows-client-50.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    assetTypeVersion: {
      id: '6e981853-58f7-498c-a55b-c7b493d17803',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Client","description":"Client asset specifications","type":"object","properties":{"DeviceType":{"description":"Type of the client device.","type":"string","minLength":1,"enum":["PC","Desktop","Laptop","Mobile","Tablet","Network Device"]},"DeviceName":{"description":"Assigned name to the client device.","type":"string"},"MACAddress":{"description":"The physical address of the device for network identification.","type":"string","pattern":"^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$|^$"},"IPAddress":{"description":"The IP address assigned to the device.","type":"string","pattern":"^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$|^$"},"ConnectionStatus":{"description":"Connection status of the device.","type":"string","enum":["Connected","Disconnected","Connecting"]},"NetworkPorts":{"description":"List of active network ports on the device.","type":"array","items":{"type":"string"}},"Username":{"description":"Username used to log into the device.","type":"string"},"PhysicalLocation":{"description":"Physical location of the device (e.g., room, floor).","type":"string"},"Hardware":{"description":"Hardware specifications of the device.","type":"object","properties":{"CPU":{"description":"Type and speed of the processor.","type":"string"},"RAM":{"description":"Capacity and type of RAM.","type":"string"},"Storage":{"description":"Type and capacity of storage.","type":"string"},"GPU":{"description":"Type and model of the graphics card.","type":"string"}}},"InstallationPurchaseDate":{"description":"Date of purchase or installation.","type":"string","format":"date"},"DeviceStatus":{"description":"Status of the device.","type":"string","enum":["Active","Inactive","Repairing","Under Maintenance"]},"LastUpdateDate":{"description":"Date of the last software or OS update.","type":"string","format":"date"},"AccessType":{"description":"Access type to the network.","type":"string","enum":["Direct","VPN","Wi-Fi"]},"HealthStatus":{"description":"Health status of the device (e.g., CPU usage, memory issues).","type":"string"},"ConnectedUsers":{"description":"Number of users connected to the device.","type":"integer"},"Connections":{"description":"Types of connections (e.g., LAN, Wi-Fi, VPN).","type":"array","items":{"type":"string"}},"SoftwareConfiguration":{"description":"List of installed software and versions.","type":"array","items":{"type":"string"}},"GroupDepartment":{"description":"Group or department the device belongs to.","type":"string"},"LastUsageDate":{"description":"Last usage date of the device.","type":"string","format":"date"},"WiFiMACAddress":{"description":"MAC address for Wi-Fi connectivity.","type":"string","pattern":"^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$|^$"},"PowerSource":{"description":"Type and status of the power source (e.g., battery, direct power).","type":"string"},"ProtocolSupport":{"description":"Network protocols supported by the device.","type":"array","items":{"type":"string"}}},"required":["DeviceType"]}',
      archived: false,
      hasLocation: true,
      version: 1,
    },
  },
  {
    id: 'a4f9e2cb-b2e1-46ee-8137-3ff269c0d707',
    code: 'SWL',
    name: 'Software License',
    iconPath: null,
    // 'files/assetType/icons/1778939068829-diploma.png',
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    assetTypeVersion: {
      id: 'edd7a32e-ecc4-4471-9eb7-c5f3f1af72b3',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Software License","type":"object","properties":{"LicenseType":{"type":"string","minLength":1,"enum":["Perpetual","SubscriptionBased","OpenSource"]},"AtivationCode":{"type":"string","description":"Code used to activate the software"},"StartDate":{"type":"string","format":"date","description":"License start date"},"ExpirationDate":{"type":"string","format":"date","description":"License expiration date"},"AuthorizedUsersOrDevices":{"type":"integer","description":"Number of users or devices allowed under the license"},"UsageLocation":{"type":"string","description":"Location or branch using the license"},"SoftwareName":{"type":"string","description":"Name of the software or product covered by the license"},"LicenseDetails":{"type":"string","description":"Additional details about the license type and features"},"RenewalOrReviewDate":{"type":"string","format":"date","description":"Dates when the license needs renewal or review","metadata":{"eventType":"key_end_of_life_email"}},"SupportLevel":{"type":"string","enum":["24/7","Email","Phone"],"description":"Support level provided"},"LicenseProvider":{"type":"string","description":"Company or individual who issued the license"},"GeographicalRestrictions":{"type":"string","description":"Geographic locations where the license is valid"},"AdditionalModulesLicense":{"type":"string","description":"Modules or features covered under this license"},"LicenseCost":{"type":"integer","description":"Cost of the license or renewal"},"ActivationStatus":{"type":"string","enum":["Active","Inactive","Expired"],"description":"Current status of the license"},"RefundOrCancellationPolicy":{"type":"string","description":"Refund or cancellation terms"},"LicenseOwner":{"type":"string","description":"Individual or organization owning the license"},"ContractType":{"type":"string","enum":["SaaS","OnPremises"],"description":"Type of contract related to the license"},"ConcurrentLicenses":{"type":"integer","description":"Number of users allowed to use the license concurrently"},"PurchaseDate":{"type":"string","format":"date","description":"Date of purchase or acquisition of the license"},"LicenseDuration":{"type":"integer","description":"Duration of the license in years"},"SupportContactDetails":{"type":"string","description":"Contact information for technical support or license renewal"},"TermsAndConditions":{"type":"string","description":"Terms and conditions related to the license"},"SoftwareVersion":{"type":"string","description":"Software version for which the license is valid"},"AttachedDocuments":{"type":"array","items":{"type":"string","description":"URLs or file paths to related documents like PDFs or contracts"}}},"required":["LicenseType"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: 'c2e5e2e5-b664-4f4d-bf6f-22592b0bd129',
    code: 'ENK',
    name: 'Encryption Key',
    iconPath: null,
    // 'files/assetType/icons/1779001937600-padlock.png',
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    assetTypeVersion: {
      id: '92bd6f2e-1de4-4eac-ba08-421a3d4c7985',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Encryption Key","type":"object","properties":{"KeyName":{"type":"string","description":"Unique name or identifier of the encryption key"},"KeyType":{"type":"string","enum":["Symmetric","Asymmetric"],"description":"Type of encryption key"},"EncryptionAlgorithm":{"type":"string","enum":["AES","RSA","ECC","DES","3DES","Blowfish","ChaCha20"],"description":"Encryption algorithm used"},"KeyLength":{"type":"integer","description":"Length of the encryption key in bits"},"KeyGenerationDate":{"type":"string","format":"date","description":"Date when the encryption key was generated"},"ValidityStartDate":{"type":"string","format":"date","description":"Start date of the key validity period"},"ValidityEndDate":{"type":"string","format":"date","description":"End date of the key validity period","metadata":{"eventType":"expiration_license_sms"}},"KeyStatus":{"type":"string","enum":["Active","Inactive","Expired","Revoked","Compromised"],"description":"Current status of the encryption key"},"KeyUsage":{"type":"string","enum":["Encryption","Decryption","Signing","Verification","KeyExchange"],"description":"Purpose of the encryption key"},"BackupAvailable":{"type":"boolean","description":"Indicates whether a backup of the key exists"},"Description":{"type":"string","description":"Additional details about the encryption key"}},"required":["KeyName","KeyType","EncryptionAlgorithm","KeyLength","KeyGenerationDate","ValidityStartDate","ValidityEndDate","KeyStatus","KeyUsage"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
];

export const AssetTypeSeeder = async (datasource: DataSource) => {
  const path = 'files/assetType/icons';
  const uploadPath = join(process.cwd(), path);
  const sourceFile = join(process.cwd(), 'src/database/seeder', path);
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }
  for (let i = 0; i < assetTypes.length; i++) {
    const element = assetTypes[i];

    let assetType = await datasource.getRepository(AssetType).findOne({
      where: [
        {
          name: element.name,
          code: element.code,
          assetCategoryId: element.assetCategoryId,
        },
        { id: element.id },
      ],
    });

    if (assetType) {
      if (assetType.id !== element.id) {
        console.log(
          `asset-type id does not match ${JSON.stringify({
            assetType: assetType.id,
            id: element.id,
            name: element.name,
            code: element.code,
            assetCategoryId: element.assetCategoryId,
          })}`,
        );
      }
      continue;
    }

    if (
      element.assetTypeVersion.hasLocation &&
      element.assetTypeVersion.locationTypeNames
    ) {
      element.assetTypeVersion.locationTypes = [];
      for (
        let i = 0;
        i < element.assetTypeVersion.locationTypeNames.length;
        i++
      ) {
        const locationTypeName = element.assetTypeVersion.locationTypeNames[i];
        const locationType = await datasource
          .getRepository(LocationType)
          .findOne({ where: { name: locationTypeName } });
        if (!locationType) {
          console.log(locationTypeName);
          throw new NotFoundException('locationType');
        }
        element.assetTypeVersion.locationTypes.push(locationType);
      }
    }

    if (element.iconPath) {
      copyFileSync(
        join(sourceFile, element.iconPath),
        join(uploadPath, element.iconPath),
      );
    }

    assetType = await datasource
      .getRepository(AssetType)
      .save({ ...element, iconPath: path + '/' + element.iconPath });

    await datasource
      .getRepository(AssetTypeVersion)
      .save({ ...element.assetTypeVersion, assetTypeId: assetType.id });
  }

  return true;
};
