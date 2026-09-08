import { NotFoundException } from '@nestjs/common';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { AssetTypeClassificationEnum } from 'src/common/enums/asset-type-classification.enum';
import { LocationType } from 'src/location-type/entities/location-type.entity';
import { DataSource } from 'typeorm';

const assetTypes: {
  id: string;
  name: string;
  code: string;
  iconPath?: string | null;
  assetCategoryId: string;
  isShareable?: boolean;
  assetTypeVersion: {
    id: string;
    content: string;
    archived: false;
    hasLocation: boolean;
    locationTypeNames?: string[];
    locationTypes?: LocationType[];
    version: number;
    classification?: AssetTypeClassificationEnum;
  };
}[] = [
  // {
  //   id: '030bb0aa-418e-4c7c-b215-1cc15d2399f3',
  //   code: 'PYS',
  //   name: 'Payment System',
  //   iconPath: null,
  //   assetCategoryId: '97f0aa5b-3d3a-4e53-8579-bcb1468b7046',
  //   isShareable: false,
  //   assetTypeVersion: {
  //     id: '75072e66-95b1-450b-92df-24f95d44584d',
  //     content:
  //       '{"$schema":"http://json-schema.org/schema#","title":"Application Configuration","type":"object","properties":{"InstallationDate":{"description":"Date the application was installed.","type":"string","format":"date"},"LastUpdateDate":{"description":"Date the application was last updated.","type":"string","format":"date"},"Configuration":{"description":"Application-specific configuration settings.","type":"object","properties":{"ConfigFilePath":{"description":"Path to the main configuration file.","type":"string","pattern":"^/.+$|^$"},"Environment":{"description":"Environment where the application is running.","type":"string","enum":["Development","Testing","Production"]},"Dependencies":{"description":"List of dependencies required by the application.","type":"array","items":{"description":"Name and version of the dependency.","type":"string","pattern":"^[a-zA-Z0-9_-]+(\\\\s*:\\\\s*\\\\d+(\\\\.\\\\d+)*)?$|^$"}},"PortsUsed":{"description":"Ports used by the application.","type":"array","items":{"description":"Port number.","type":"integer"}}}},"Status":{"description":"Current status of the application.","type":"string","enum":["Running","Stopped","Error"]},"SecuritySettings":{"description":"Security settings for the application.","type":"object","properties":{"AuthenticationEnabled":{"description":"Whether authentication is enabled for the application.","type":"boolean"},"EncryptionEnabled":{"description":"Whether data encryption is enabled for the application.","type":"boolean"},"AccessControlList":{"description":"List of allowed IPs or users for accessing the application.","type":"array","items":{"description":"IP address or username.","type":"string","pattern":"^[a-zA-Z0-9._-]+$|^$"}}}},"Maintenance":{"description":"Maintenance details of the application.","type":"object","properties":{"NextScheduledMaintenance":{"description":"Next scheduled maintenance date and time.","type":"string","format":"date"},"MaintenanceContact":{"description":"Contact information for maintenance.","type":"string","pattern":"^[a-zA-Z0-9._@\\\\s-]+$|^$"}}}}}',
  //     archived: false,
  //     hasLocation: false,
  //     version: 1,
  //   },
  // },
  {
    id: '04956026-be7c-47d0-afb4-27091efbea8f',
    code: 'APM',
    name: 'Access Point / Modem',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '654d07df-cd7b-4611-8dfb-6e69fd492f44',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"AccessPointModem","description":"Access Point / Modem asset specifications","type":"object","properties":{"DeviceType":{"description":"Type of device","type":"string","minLength":1,"enum":["Access Point","Modem","Wireless Router","Gateway","Mesh AP","Outdoor AP","Enterprise AP","Consumer AP","Cable Modem","DSL Modem","Fiber Modem/ONT","5G/4G Modem","Satellite Modem"]},"Vendor":{"description":"Manufacturer or vendor of the Access Point or Modem (e.g., Cisco, Aruba, Ruckus, Ubiquiti, MikroTik, Netgear, TP-Link, Huawei, ZTE)","type":"string","minLength":1},"Model":{"description":"Model name or number of the Access Point or Modem (e.g.,  Catalyst 9130, AP-535, UniFi U6-Pro)","type":"string","minLength":1},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"Network":{"description":"Details about Network addresses","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"The physical address of the device for network identification.","type":"string","pattern":"^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$|^$"},"Domain":{"description":"The Domain of the network.","type":"string","minLength":1}},"required":["IPAddress","Domain"]},"SerialNumber":{"description":"Serial number of the device","type":"string"},"FirmwareVersion":{"description":"Current firmware version installed on the device","type":"string"},"State":{"type":"object","properties":{"currentState":{"description":"The current state","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["DeviceType","Vendor","Model","Environment","Network"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: '1460a08f-aea3-42fa-b3ae-01efcaa092d0',
    code: 'FTP',
    name: 'FTP Service',
    iconPath: null,
    assetCategoryId: 'e7dca7c3-8d41-4dd6-9236-b9ca2e6cb463',
    isShareable: false,
    assetTypeVersion: {
      id: 'c9975a9d-472d-496e-9fd1-3fb27be6b11f',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"FTP Service","description":"FTP Service asset specifications","type":"object","properties":{"ProtocolType":{"type":"string","minLength":1,"enum":["FTP","SFTP","MFT","FTPS"]},"Network":{"description":"Details about Network address","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","minLength":1,"enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"Domain":{"description":"The Domain of the network.","type":"string"}},"required":["IPAddress","Zone"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["ProtocolType","Network","Environment"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '1493acfd-5d92-4aa4-a786-7d7dbde9bad2',
    code: 'HUB',
    name: 'Hub',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '160a508a-ec85-4e03-9407-3af735f98792',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Hub","description":"Network Hub asset specifications","type":"object","properties":{"Vendor":{"description":"Manufacturer or vendor of the hub (e.g., Cisco, Netgear, D-Link, TP-Link, Linksys, Belkin, 3Com, IBM)","type":"string","minLength":1},"Model":{"description":"Model name or number of the hub (e.g., Netgear EN104, D-Link DES-1008D, Cisco 4300)","type":"string","minLength":1},"HubType":{"description":"Type of network hub","type":"string","enum":["Passive Hub","Active Hub","Intelligent Hub","Ethernet Hub","USB Hub","Token Ring Hub","Fibre Channel Hub","Stackable Hub"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"SerialNumber":{"description":"Serial number of the hub","type":"string"},"Ports":{"description":"Port configuration of the hub","type":"object","properties":{"TotalPorts":{"description":"Total number of ports on the hub","type":"integer","minimum":1},"ActivePorts":{"description":"Number of currently active/used ports","type":"integer","minimum":0},"AvailablePorts":{"description":"Number of available (unused) ports","type":"integer","minimum":0},"PortTypes":{"description":"Types of ports available","type":"array","items":{"type":"string","enum":["RJ45","BNC (Coaxial)","AUI (Thicknet)","USB-A","USB-C","SFP","Fiber SC","Fiber ST","Token Ring","DB9 Serial"]}},"PortSpeeds":{"description":"Supported port speeds","type":"array","items":{"type":"string","enum":["10 Mbps","100 Mbps","10/100 Mbps","1 Gbps","10/100/1000 Mbps","USB 2.0 (480 Mbps)","USB 3.0 (5 Gbps)","USB 3.1 (10 Gbps)"]}}}},"InterfaceType":{"description":"Network interface type supported by the hub","type":"array","items":{"type":"string","enum":["Ethernet","Fast Ethernet","Gigabit Ethernet","Token Ring","Fibre Channel","USB","Thicknet (10BASE-5)","Thinnet (10BASE-2)","Twisted Pair (10BASE-T)","100BASE-TX","100BASE-FX"]}},"State":{"type":"object","properties":{"currentState":{"description":"The current state","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Vendor","Model","Environment"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: '20b44c6d-76b3-4682-a7fd-daef96c683d1',
    code: 'CNT',
    name: 'Container',
    iconPath: null,
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    isShareable: false,
    assetTypeVersion: {
      id: '5776629e-efe4-4446-a7fc-d9f2b5adc5fb',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Container","description":"Container asset specifications","type":"object","properties":{"Type":{"description":"Specific container name","type":"string","enum":["Kubernetes","Docker","Podman","OpenShift","Other"]},"Network":{"description":"Details about Network addresses","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"array","minItems":1,"items":{"description":"IP address","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"metadata":{"isSearchable":true}},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]}},"required":["IPAddress"]},"Services":{"type":"array","items":{"type":"object","properties":{"ServiceName":{"type":"string"},"Status":{"type":"string","enum":["Active","Disabled"]},"StartupSetting":{"type":"string","enum":["Automatic","Manual"]}}}},"State":{"type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}},"LicenseStatus":{"type":"string","enum":["Valid","Expired","NotActive"]}},"required":["Type","Network","LicenseStatus"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '2d5463ed-762f-42fd-b08a-4530aa96abac',
    code: 'UPD',
    name: 'Update Service',
    iconPath: null,
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    isShareable: false,
    assetTypeVersion: {
      id: '412f4998-1dab-41a0-a01f-7872c814aca4',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Update Server","description":"Update Service asset specifications","type":"object","properties":{"UpdateType":{"description":"Type of a Target Resource","type":"string","minLength":1,"enum":["OperatingSystem","Software","Library","Repository"]},"Network":{"description":"Details about Network address","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","minLength":1,"enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"Domain":{"description":"The Domain of the network.","type":"string"}},"required":["IPAddress","Zone"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["UpdateType","Network","Environment"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '36904be9-45ef-485b-80d4-f339cd0cae32',
    code: 'ACD',
    name: 'Active Directory',
    iconPath: null,
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    isShareable: false,
    assetTypeVersion: {
      id: '694b71fe-01e5-4427-894b-1508884d8350',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Active Directory","description":"Active Directory Service asset specifications","type":"object","properties":{"Network":{"description":"Details about Network address","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","minLength":1,"enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"Domain":{"description":"The Domain of the network.","type":"string","minLength":1}},"required":["IPAddress","Zone","Domain"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"NumberOfDomainControllers":{"type":"number"},"NumberOfDomainChildren":{"type":"number"},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Network","Environment","NumberOfDomainControllers","NumberOfDomainChildren"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '4353725b-ecf9-46eb-a557-65c9eb391361',
    code: 'SWT',
    name: 'Switch',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '4278284f-c4e5-4401-95b8-1b0e174576da',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Switch","description":"Network Switch asset specifications","type":"object","properties":{"Type":{"description":"Type of network switch","type":"string","minLength":1,"enum":["Managed Switch","Unmanaged Switch","Smart Switch","PoE Switch","Layer 2 Switch","Layer 3 Switch","Stackable Switch","Chassis Switch","Fixed Configuration Switch","Modular Switch","Data Center Switch","Core Switch","Distribution Switch","Access Switch","Top-of-Rack Switch","End-of-Row Switch"]},"Vendor":{"description":"Manufacturer or vendor of the switch (e.g., Cisco, Juniper, Arista, HPE, Dell, Aruba, Ruckus)","type":"string","minLength":1},"Model":{"description":"Model name or number of the switch (e.g., Cisco Catalyst 9300, Juniper EX4300)","type":"string","minLength":1},"FirmwareOS":{"description":"Firmware or Operating System type running on the switch","type":"string","minLength":1,"enum":["IOS","IOS-XE","IOS-XR","NX-OS","JUNOS","EOS","ArubaOS","ProVision","Comware","FabricOS","FTOS","ArubaOS-CX","ExtremeXOS","Ruckus ICX","Mellanox Onyx","Cumulus Linux","SONiC","PicOS"]},"OSVersion":{"description":"Specific version of the firmware or operating system","type":"string","minLength":1},"Network":{"description":"Details about Network addresses","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"The physical address of the device for network identification.","type":"string","pattern":"^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$|^$"}},"required":["IPAddress"]},"SerialNumber":{"description":"Serial number of the switch","type":"string"},"IPAddress":{"description":"Management IP address of the switch","type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"MACAddress":{"description":"MAC address of the switch management interface","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"},"PortConfiguration":{"description":"Detailed port configuration of the switch","type":"object","properties":{"TotalPorts":{"description":"Total number of ports on the switch","type":"integer","minimum":1},"ActivePorts":{"description":"Number of currently active/used ports","type":"integer","minimum":0},"AvailablePorts":{"description":"Number of available ports","type":"integer","minimum":0},"PortSpeeds":{"description":"Supported port speeds","type":"array","items":{"type":"string","enum":["10Mbps","100Mbps","1Gbps","2.5Gbps","5Gbps","10Gbps","25Gbps","40Gbps","100Gbps","400Gbps"]}},"PortTypes":{"description":"Types of ports available","type":"array","items":{"type":"string","enum":["RJ45","SFP","SFP+","SFP28","QSFP","QSFP+","QSFP28","QSFP-DD","OSFP","Combo Ports","PoE","PoE+","PoE++"]}},"PoEBudget":{"description":"Total PoE power budget in Watts","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"UplinkPorts":{"description":"Number of uplink ports","type":"integer","minimum":0}}},"Installation":{"type":"object","properties":{"InstallationDate":{"description":"Initial installation date","type":"string","format":"date"}}},"Updates":{"type":"array","items":{"type":"object","properties":{"UpdateDate":{"description":"Date of update","type":"string","format":"date"},"PackageName":{"description":"The name of update patch or package","type":"string"}}}},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Type","Vendor","Model","FirmwareOS","OSVersion","Network"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  // {
  //   id: '52984a6f-0695-4916-997d-a6f6117eb70d',
  //   code: 'CBK',
  //   name: 'Core Banking',
  //   iconPath: null,
  //   assetCategoryId: '97f0aa5b-3d3a-4e53-8579-bcb1468b7046',
  //   isShareable: false,
  //   assetTypeVersion: {
  //     id: 'cf90db44-e5f5-4f13-bf44-3e8eba6cf88c',
  //     content:
  //       '{"$schema":"http://json-schema.org/schema#","title":"Application Configuration","type":"object","properties":{"InstallationDate":{"description":"Date the application was installed.","type":"string","format":"date"},"LastUpdateDate":{"description":"Date the application was last updated.","type":"string","format":"date"},"Configuration":{"description":"Application-specific configuration settings.","type":"object","properties":{"ConfigFilePath":{"description":"Path to the main configuration file.","type":"string","pattern":"^/.+$|^$"},"Environment":{"description":"Environment where the application is running.","type":"string","enum":["Development","Testing","Production"]},"Dependencies":{"description":"List of dependencies required by the application.","type":"array","items":{"description":"Name and version of the dependency.","type":"string","pattern":"^[a-zA-Z0-9_-]+(\\\\s*:\\\\s*\\\\d+(\\\\.\\\\d+)*)?$|^$"}},"PortsUsed":{"description":"Ports used by the application.","type":"array","items":{"description":"Port number.","type":"integer"}}}},"Status":{"description":"Current status of the application.","type":"string","enum":["Running","Stopped","Suspended","Error"]},"SecuritySettings":{"description":"Security settings for the application.","type":"object","properties":{"AuthenticationEnabled":{"description":"Whether authentication is enabled for the application.","type":"boolean"},"EncryptionEnabled":{"description":"Whether data encryption is enabled for the application.","type":"boolean"},"AccessControlList":{"description":"List of allowed IPs or users for accessing the application.","type":"array","items":{"description":"IP address or username.","type":"string","pattern":"^[a-zA-Z0-9._-]+$|^$"}}}},"Maintenance":{"description":"Maintenance details of the application.","type":"object","properties":{"NextScheduledMaintenance":{"description":"Next scheduled maintenance date and time.","type":"string","format":"date"},"MaintenanceContact":{"description":"Contact information for maintenance.","type":"string","pattern":"^[a-zA-Z0-9._@\\\\s-]+$|^$"}}}}}',
  //     archived: false,
  //     hasLocation: false,
  //     version: 1,
  //   },
  // },
  {
    id: '5cd597e7-53e5-45f6-851a-706b29adc1f8',
    code: 'BKD',
    name: 'Backup Device',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: 'ab554fb8-6299-47da-be04-006e7ae83a83',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"BackupDevice","description":"Backup Device asset specifications","type":"object","properties":{"Vendor":{"description":"The manufacturer or vendor of the backup device","type":"string","minLength":1},"Model":{"description":"The model name or number of the backup device","type":"string","minLength":1},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"BackupType":{"description":"The type of backup solution","type":"string","enum":["Tape Library","Disk Array","Cloud Backup Gateway","Virtual Tape Library","NAS Backup","Deduplication Appliance"]},"SerialNumber":{"description":"The serial number of the backup device","type":"string"},"Network":{"description":"Details about IPs and Mac addresses","type":"object","minProperties":1,"properties":{"IP":{"description":"IP address","type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"},"OtherNetworkAdaptors":{"type":"array","items":{"type":"object","properties":{"IP":{"description":"IP address ","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"}},"required":["IP"]}}}},"StorageCapacity":{"description":"Total storage capacity of the backup device","type":"object","properties":{"TotalTB":{"description":"Total capacity in Terabytes","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"UsedTB":{"description":"Used capacity in Terabytes","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"AvailableTB":{"description":"Available capacity in Terabytes","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}}},"FirmwareVersion":{"description":"Current firmware version installed on the device","type":"string"},"SupportedBackupTargets":{"description":"Types of systems this backup device supports","type":"array","items":{"type":"string","enum":["Physical Servers","Virtual Machines","Containers","Databases","File Systems","Cloud Workloads","Applications"]}},"LicenseStatus":{"type":"string","minLength":1,"enum":["Valid","Expired","NotActive"]},"State":{"type":"object","properties":{"currentState":{"description":"The current state","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Vendor","Model","Environment","LicenseStatus"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: '77546b0d-0f43-4c23-af4b-69219073f06c',
    code: 'SSW',
    name: 'SAN Switch',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '2e5a7f8b-f360-4ce4-a41a-b80be87e1ff4',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"SANSwitch","description":"SAN Switch asset specifications","type":"object","properties":{"Vendor":{"description":"The manufacturer or vendor of the SAN switch (e.g., Cisco, Brocade, Dell, HPE)","type":"string","minLength":1},"Model":{"description":"The model name or number of the SAN switch (e.g., Cisco MDS 9148, Brocade G620)","type":"string","minLength":1},"SwitchType":{"description":"The type of SAN switch","type":"string","enum":["Fibre Channel","Fibre Channel over Ethernet (FCoE)","iSCSI","NVMe over Fabrics","FC Director","FC Switch","FC Router"]},"Network":{"description":"Details about IPs and Mac addresses","type":"object","minProperties":1,"properties":{"ManagementIP":{"description":"Management IP address for Administration","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"ManagementMAC":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"},"Gateway":{"description":"Default gateway for management network","type":"string","pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^$"},"OtherNetworkAdaptors":{"type":"array","items":{"type":"object","properties":{"IP":{"description":"IP address ","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"}},"required":["IP"]}}},"required":["ManagementIP"]},"LicenseStatus":{"description":"Current status of the SAN switch software license","type":"string","minLength":1,"enum":["Active","Expired","Trial","Maintenance Required","Not Licensed"]},"SerialNumber":{"description":"The serial number of the SAN switch","type":"string"},"PortConfiguration":{"description":"Detailed port configuration of the SAN switch","type":"object","properties":{"TotalPorts":{"description":"Total number of ports on the switch","type":"integer","minimum":1},"ActivePorts":{"description":"Number of currently active/used ports","type":"integer","minimum":0},"PortSpeed":{"description":"Port speed capability (e.g., 8Gbps, 16Gbps, 32Gbps)","type":"array","items":{"type":"string","enum":["2Gbps","4Gbps","8Gbps","16Gbps","32Gbps","64Gbps","128Gbps"]}},"PortType":{"description":"Types of ports available","type":"array","items":{"type":"string","enum":["F_Port","E_Port","N_Port","NL_Port","FL_Port","VE_Port","EX_Port"]}},"SFPType":{"description":"Type of SFP/SFP+ modules used","type":"array","items":{"type":"string","enum":["SFP","SFP+","SFP28","QSFP","QSFP+","QSFP28"]}},"ZoningEnabled":{"description":"Whether zoning is configured on the switch","type":"boolean"}}},"FirmwareVersion":{"description":"Current firmware/OS version running on the SAN switch","type":"string"},"State":{"type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}},"Installation":{"type":"object","properties":{"InstallationDate":{"description":"Initial installation date","type":"string","format":"date"}}}},"required":["Vendor","Model","Network","LicenseStatus"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: 'bd45b356-ad58-46c0-8d18-6fb2ca88df22',
    code: 'RST',
    name: 'Removable Storage',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '4f3a1880-76f2-4789-9021-c651cf09ec84',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"RemovableStorage","description":"Removable Storage asset specifications","type":"object","properties":{"Vendor":{"description":"Manufacturer or brand of the removable storage device (e.g., SanDisk, Seagate, WD, Kingston, Sony)","type":"string"},"Model":{"description":"Model name or number of the removable storage device","type":"string"},"Type":{"description":"Type of removable storage media","type":"string","minLength":1,"enum":["USB Drive","External HDD","External SSD","Memory Card","Tape Cartridge","Optical Disc (CD/DVD/Blu-ray)","Floppy Disk","Portable Flash Storage","External NVMe Drive","CompactFlash","SD Card","MicroSD Card","Zip Drive","Jaz Drive"]},"Capacity":{"description":"Storage capacity of the removable media","type":"object","properties":{"Size":{"description":"Total capacity size","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"Unit":{"description":"Unit of measurement","type":"string","enum":["MB","GB","TB","PB"]},"FormattedSize":{"description":"Formatted usable capacity","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}},"required":["Size","Unit"]},"SerialNumber":{"description":"Serial number or unique identifier of the device","type":"string"},"Encryption":{"description":"Encryption details of the removable storage","type":"object","properties":{"Encrypted":{"description":"Whether the storage is encrypted","type":"boolean"},"EncryptionType":{"description":"Type of encryption used","type":"string","enum":["AES-256","AES-128","BitLocker","FileVault","VeraCrypt","LUKS","Proprietary","Software Based","Hardware Based","Other"]},"PasswordProtected":{"description":"Whether password protection is enabled","type":"boolean"}}},"InterfaceTypes":{"description":"Connection interface types supported","type":"string","enum":["USB 2.0","USB 3.0","USB 3.1","USB 3.2","USB-C","Thunderbolt","eSATA","SATA","FireWire","SCSI","Parallel","PS/2","SD Card Slot","MicroSD Slot","CompactFlash Slot"]},"FileSystem":{"description":"File system format type","type":"string","enum":["FAT32","NTFS","exFAT","APFS","HFS+","EXT4","EXT3","XFS","UDF","ISO9660","Unformatted","Raw"]},"DataConfidentiality":{"type":"string","enum":["Confidential","Sensitive","NotRestricted"]}},"required":["Type","Capacity","DataConfidentiality"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: 'c42ca970-821b-42b0-ac84-386864087ea1',
    code: 'DNS',
    name: 'DNS',
    iconPath: null,
    assetCategoryId: 'e7dca7c3-8d41-4dd6-9236-b9ca2e6cb463',
    isShareable: false,
    assetTypeVersion: {
      id: '6e83cdaf-f55f-4a1c-bcb2-1017ecaf2c90',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"DNS","description":"DNS Service asset specifications","type":"object","properties":{"Network":{"description":"Details about Network addresses","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","minLength":1,"enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"Domain":{"description":"The Domain of the network.","type":"string"}},"required":["IPAddress","Zone"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"DNSZone":{"type":"string","minLength":1,"enum":["Internal","External"]},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Network","Environment","DNSZone"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: 'c752d1dc-ffaf-4932-941f-fe88fa860308',
    code: 'ESX',
    name: 'ESXi',
    iconPath: null,
    assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
    isShareable: false,
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
    id: 'ca4e71d4-173c-4120-9e16-2aefe3504c72',
    code: 'DHC',
    name: 'DHCP',
    iconPath: null,
    assetCategoryId: 'e7dca7c3-8d41-4dd6-9236-b9ca2e6cb463',
    isShareable: false,
    assetTypeVersion: {
      id: '53e71a2e-4b53-48da-9745-c6022a64183c',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"DHCP","description":"DHCP Service asset specifications","type":"object","properties":{"Network":{"description":"Details about Network address","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","minLength":1,"enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"Domain":{"description":"The Domain of the network.","type":"string"}},"required":["IPAddress","Zone"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Network","Environment"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: 'd751b495-87aa-46d0-8eaa-b26be9c9f208',
    code: 'DBS',
    name: 'Database',
    iconPath: null,
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    isShareable: false,
    assetTypeVersion: {
      id: 'be0603d8-2d0a-46e2-ae23-560a1d322de4',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"DatabaseAsset","description":"Database asset specifications for all DBMS platforms","type":"object","properties":{"Type":{"description":"Specific database product name","type":"string","minLength":1,"enum":["Oracle","DB2","Informix","Microsoft SQL Server","PostgreSQL","MySQL","MongoDB","Cassandra","Redis","Elasticsearch","Neo4j","InfluxDB","DynamoDB","CosmosDB","MariaDB","Snowflake","BigQuery","Redshift","Other"]},"Version":{"description":"Database version","type":"string","minLength":1,"pattern":"^\\\\d+(\\\\.\\\\d+)*$"},"DataModel":{"description":"Data Model of database system","type":"string","enum":["Relational","NoSQL","Graph","Document","Key-Value","Column-Family","Time-Series","Spatial","Vector"]},"State":{"description":"Operational State of Service","type":"object","properties":{"currentState":{"description":"The current state of the VM","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}},"LicenseStatus":{"type":"string","minLength":1,"enum":["Valid","Expired","NotActive"]},"DataConfidentiality":{"type":"string","minLength":1,"enum":["Confidential","Sensitive","NotRestricted"]}},"required":["Type","Version","LicenseStatus","DataConfidentiality"]}',
      archived: false,
      hasLocation: false,
      version: 1,
    },
  },
  {
    id: '2cb6aa8d-2471-495c-96bf-db423c33477f',
    code: 'OSY',
    name: 'Operating System',
    iconPath: '1754568171627-windows.png',
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    isShareable: false,
    assetTypeVersion: {
      id: '26f959e1-82b5-4651-8c83-c8cbacc21e11',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Operating System","description":"Operating System specifications","type":"object","properties":{"Type":{"description":"The type of the Operating System","type":"string","minLength":1,"metadata":{"isSearchable":true}},"Version":{"description":"The version of the Operating System","type":"string","minLength":1,"metadata":{"isSearchable":true}},"Installations":{"type":"object","properties":{"InitialInstallationDate":{"type":"string","format":"date"},"Updates":{"description":"All update and patches","type":"array","items":{"type":"object","properties":{"PackageIdentifer":{"description":"Update version or package","type":"string"},"UpdateDate":{"description":"Date update applied","type":"string","format":"date"}}}}}},"FileSystem":{"type":"object","properties":{"Type":{"type":"string","enum":["FAT32","EXT3","EXT4","NTFS","XFS"]},"Partitions":{"type":"object","properties":{"VolumeIdentifier":{"type":"string"},"Capacity":{"description":"Partition capacity (MB)","type":"integer"}}}}},"Services":{"type":"array","items":{"type":"object","properties":{"ServiceName":{"type":"string"},"Status":{"type":"string","enum":["Active","Disabled"]},"StartupSetting":{"type":"string","enum":["Automatic","Manual"]}}}},"LicenseStatus":{"type":"string","minLength":1,"enum":["Valid","Expired","NotActive"]}},"required":["Type","Version","LicenseStatus"]}',
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
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    isShareable: false,
    assetTypeVersion: {
      id: 'a4ecfb5b-c8a8-4116-890b-6e68788495e5',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Hypervisor","description":"Hypervisor asset specifications","type":"object","properties":{"Type":{"description":"Specific Hypervisor name","type":"string","minLength":1,"enum":["VMware ESXi","Microsoft Hyper-V","KVM","Xen","Proxmox VE","Other"]},"Version":{"description":"The version of the Hypervisor","type":"string","minLength":1,"metadata":{"isSearchable":true}},"State":{"type":"object","properties":{"currentState":{"type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}},"LicenseStatus":{"type":"string","minLength":1,"enum":["Valid","Expired","NotActive"]}},"required":["Type","Version","LicenseStatus"]}',
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
    isShareable: false,
    assetCategoryId: 'fe89b5b0-c292-4c5d-b9a8-807e65f14bd6',
    assetTypeVersion: {
      id: '02fc284e-db7e-4886-a7b8-feddcf50daef',
      content:
        '{   "$schema": "http://json-schema.org/schema#",   "title": "VM",   "description": "VM asset specifications",   "type": "object",   "properties": {     "Services": {       "type": "array",       "items": {         "type": "object",         "properties": {           "ServiceName": {             "type": "string"           },           "Status": {             "type": "string",             "enum": ["Active", "Disabled"]           },           "StartupSetting": {             "type": "string",             "enum": ["Automatic", "Manual"]           }         }       }     },     "Network": {       "description": "Network configuration details",       "type": "array",       "items": {         "type": "object",         "properties": {           "IPAddress": {             "description": "Assigned IP address",             "type": "string",             "minLength": 1,             "pattern": "^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"           },           "Zone": {             "description": "Network Zone where IP is valid",             "type": "string",             "minLength": 1,             "enum": [               "NSS",               "NIBN",               "Nasim",               "OEdge",               "BDC",               "CDC",               "TA-ODC",               "BI-EDW",               "Novin",               "Hafez",               "Infra",               "Mavara",               "Iranet",               "Other"             ]           }         },         "required": ["IPAddress"]       }     },     "CPU": {       "description": "CPU allocation details",       "type": "object",       "properties": {         "Cores": {           "description": "Number of CPU cores allocated",           "type": "integer"         },         "FrequencyGHz": {           "description": "CPU frequency in GHz",           "type": "integer"         }       }     },     "RAM": {       "description": "RAM allocation details",       "type": "object",       "properties": {         "AllocatedGB": {           "description": "Allocated RAM in GB",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         },         "UsedGB": {           "description": "Used RAM in GB",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         }       }     },     "Storage": {       "description": "Storage configuration",       "type": "object",       "properties": {         "AllocatedGB": {           "description": "Total storage in GB",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         },         "UsedGB": {           "description": "Used storage in GB",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         }       }     },     "State": {       "description": "Operational State of Service",       "type": "object",       "properties": {         "currentState": {           "description": "The current state of the VM",           "type": "string",           "enum": ["Running", "Suspended", "ShutDown", "Paused"]         },         "lastChangeDateTime": {           "type": "string",           "format": "date"         }       }     },     "HostName": {       "type": "string",       "pattern": "^(?!.*?[@!#$%^&*()+=])(?!.*?\\\\.\\\\.)(?!.*?--)[a-zA-Z0-9][a-zA-Z0-9\\\\-\\\\.\\\\/]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$|^$"     }   },   "required": ["Network"] }',
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
    isShareable: false,
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
    isShareable: false,
    assetTypeVersion: {
      id: 'b50931d6-13d6-4303-842f-f8d59f207dab',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Mainframe CPU","description":"Mainframe CPU asset specifications","type":"object","properties":{"Vendor":{"description":"Manufacturer or vendor of the CPU","type":"string","minLength":1},"Model":{"description":"Model and brand of the CPU","type":"string","minLength":1},"SerialNumber":{"description":"Model and brand of the CPU","type":"string"},"RAM":{"description":"RAM allocation details","type":"integer","minLength":1},"CPU":{"type":"object","properties":{"Cores":{"description":"CPU cores","type":"integer"},"Frequency":{"description":"CPU frequency","type":"string"}},"required":["Cores"]}},"required":["Vendor","Model","RAM","CPU"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: 'cca3a3df-632b-4229-acd9-ed3bdb03b4bb',
    code: 'MFS',
    name: 'Mainframe Storage',
    iconPath: '1754568922273-storage.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '664a8e51-368a-412a-ba34-ab2009dbc94b',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Mainframe Storage","description":"Mainframe Storage asset specifications","type":"object","properties":{"Vendor":{"description":"Manufacturer or vendor of the mainframe-storage","type":"string","minLength":1},"Model":{"description":"Model and brand of the storage","type":"string","minLength":1},"SerialNumber":{"description":"Model and brand of the storage","type":"string"},"Capacity":{"description":"Storage capacity of the storage","type":"object","properties":{"Size":{"description":"Total capacity size","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"Unit":{"description":"Unit of measurement","type":"string","enum":["MB","GB","TB","PB"]},"FormattedSize":{"description":"Formatted usable capacity","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}},"required":["Size","Unit"]},"LicenseStatus":{"type":"string","enum":["Valid","Expired","NotActive"]},"DataConfidentiality":{"type":"string","enum":["Confidential","Sensitive","NotRestricted"]}},"required":["Vendor","Model","Capacity","LicenseStatus","DataConfidentiality"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: 'd624dbb3-31c1-48dd-a61e-3c6ce3155451',
    code: 'SRV',
    name: 'Server',
    iconPath: '1754568822303-server.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '7462b757-60e4-4886-86d7-d6eafa2d959f',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Server","description":"Server asset specifications","type":"object","properties":{"Hostname":{"description":"the hostname information","type":"string","minLength":1},"Vendor":{"description":"Manufacturer (\'HP\', \'Dell\', ...) or vendor of the Server","type":"string","minLength":1},"Model":{"description":"Model and brand of the server, e.g., \'PowerEdge R740\', \'ProLiant DL380\'","type":"string","minLength":1},"ServerType":{"description":"Type of the server (Physical, Virtual, Cloud, Blade)","type":"string","enum":["Physical","Virtual","Cloud","Blade"]},"Network":{"description":"Details about IPs and Mac addresses","type":"object","minProperties":1,"properties":{"ManagementIP":{"description":"Management IP address for Administration","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"ManagementMAC":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"},"OtherNetworkAdaptors":{"type":"array","items":{"type":"object","properties":{"IP":{"description":"IP address ","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"MAC address used for network identification","type":"string","pattern":"^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"}},"required":["IP"]}}},"required":["ManagementIP"]},"LicenseStatus":{"description":"Current status of the backup software license","type":"string","minLength":1,"enum":["Active","Expired","Trial","Maintenance Required","Not Licensed"]},"Environment":{"type":"string","minLength":1,"enum":["Operation","Iranet"]},"RAM":{"description":"RAM allocation details","type":"object","minProperties":1,"properties":{"AllocatedGB":{"description":"Allocated RAM in GB","type":"string","minLength":1,"pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"},"UsedGB":{"description":"Used RAM in GB","type":"string","pattern":"^\\\\d+(\\\\.\\\\d+)?$|^$"}},"required":["AllocatedGB"]},"CPU":{"type":"object","minProperties":1,"properties":{"Cores":{"description":"CPU cores","type":"integer","minimum":1},"Frequency":{"description":"CPU frequency","type":"string"}},"required":["Cores"]},"SerialNumber":{"description":"The serial number of the server","type":"string"},"Installation":{"type":"object","properties":{"InstallationDate":{"description":"Initial installation date","type":"string","format":"date"}}},"Updates":{"type":"array","items":{"type":"object","properties":{"UpdateDate":{"description":"Date of update","type":"string","format":"date"},"PackageName":{"description":"The name of update patch or package","type":"string"}}}},"State":{"type":"object","properties":{"currentState":{"description":"The current state","type":"string","enum":["Running","Suspended","ShutDown","Paused"]},"lastChangeDateTime":{"type":"string","format":"date"}}}},"required":["Hostname","Vendor","Model","Network","LicenseStatus","Environment","RAM","CPU"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: 'de5784fa-03f4-483f-8512-a6624142157f',
    code: 'STG',
    name: 'Storage',
    iconPath: '1754568922273-storage.png',
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '1152edf3-7adb-4025-b20c-63641ab13528',
      content:
        '{   "$schema": "http://json-schema.org/schema#",   "title": "Storage",   "description": "Storage asset specifications",   "type": "object",   "properties": {     "Vendor": {       "description": "Manufacturer or vendor of the Storage",       "type": "string",       "minLength": 1     },     "Model": {       "description": "Model and brand of the storage",       "type": "string",       "minLength": 1,       "metadata": {         "isSearchable": true       }     },     "StorageType": {       "description": "Type of the storage device",       "type": "string",       "minLength": 1,       "enum": ["NAS", "SAN", "DAS"]     },     "StorageCapacity": {       "description": "Total storage capacity of the device",       "type": "object",       "properties": {         "TotalTB": {           "description": "Total capacity in Terabytes",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         },         "UsedTB": {           "description": "Used capacity in Terabytes",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         },         "AvailableTB": {           "description": "Available capacity in Terabytes",           "type": "string",           "pattern": "^\\\\d+(\\\\.\\\\d+)?$|^$"         }       },       "required": ["TotalTB"]     },     "LicenseStatus": {       "description": "Current status of the backup software license",       "type": "string",       "minLength": 1,       "enum": [         "Active",         "Expired",         "Trial",         "Maintenance Required",         "Not Licensed"       ]     },     "SerialNumber": {       "description": "The serial number of the storage",       "type": "string"     },     "Network": {       "description": "Details about IPs and Mac addresses",       "type": "object",       "minProperties": 1,       "properties": {         "ManagementIP": {           "description": "Management IP address for Administration",           "type": "string",           "minLength": 1,           "pattern": "^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"         },         "Zone": {           "description": "Network Zone where IP is valid",           "type": "string",           "enum": [             "NSS",             "NIBN",             "Nasim",             "OEdge",             "BDC",             "CDC",             "TA-ODC",             "BI-EDW",             "Novin",             "Hafez",             "Infra",             "Mavara",             "Iranet",             "Other"           ]         },         "ManagementMAC": {           "description": "MAC address used for network identification",           "type": "string",           "pattern": "^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"         },         "OtherNetworkAdaptors": {           "type": "array",           "items": {             "type": "object",             "properties": {               "IP": {                 "description": "IP address ",                 "type": "string",                 "minLength": 1,                 "pattern": "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$"               },               "Zone": {                 "description": "Network Zone where IP is valid",                 "type": "string",                 "enum": [                   "NSS",                   "NIBN",                   "Nasim",                   "OEdge",                   "BDC",                   "CDC",                   "TA-ODC",                   "BI-EDW",                   "Novin",                   "Hafez",                   "Infra",                   "Mavara",                   "Iranet",                   "Other"                 ]               },               "MACAddress": {                 "description": "MAC address used for network identification",                 "type": "string",                 "pattern": "^([0-9A-Fa-f]{2}[:.-]?){5}[0-9A-Fa-f]{2}$|^$"               }             },             "required": ["IP"]           }         }       },       "required": ["ManagementIP"]     },     "Environment": {       "description": "Deployment environment type",       "type": "string",       "minLength": 1,       "enum": ["Iranet", "Operation", "Test"]     },     "Connection": {       "description": "Network connection type for storage device",       "type": "string",       "enum": ["iSCSI", "Fibre Channel", "NFS", "CIFS"]     },     "RaidConfiguration": {       "description": "RAID configuration details",       "type": "object",       "properties": {         "RaidLevel": {           "description": "RAID level for managing drives and data",           "type": "string",           "enum": ["RAID 0", "RAID 1", "RAID 5", "RAID 10", "RAID 6"]         },         "DriveCount": {           "description": "Number of drives in the RAID group (at least 1)",           "type": "integer"         },         "HealthStatus": {           "description": "Health status of the RAID configuration",           "type": "string",           "enum": ["Healthy", "Degraded", "Failure"]         }       }     },     "State": {       "type": "object",       "properties": {         "currentState": {           "description": "The current state of the VM",           "type": "string",           "enum": ["Running", "Suspended", "ShutDown", "Paused"]         },         "lastChangeDateTime": {           "type": "string",           "format": "date"         }       }     },     "Installation": {       "type": "object",       "properties": {         "InstallationDate": {           "description": "Initial installation date",           "type": "string",           "format": "date"         }       }     },     "Updates": {       "type": "array",       "items": {         "type": "object",         "properties": {           "UpdateDate": {             "description": "Date of update",             "type": "string",             "format": "date"           },           "PackageName": {             "description": "The name of update patch or firmware",             "type": "string"           }         }       }     },     "DataConfidentiality": {       "type": "string",       "enum": ["Confidential", "Sensitive", "NotRestricted"]     }   },   "required": [     "Vendor",     "Model",     "StorageType",     "StorageCapacity",     "LicenseStatus",     "Network",     "Environment",     "DataConfidentiality"   ] }',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  {
    id: 'eb35af05-3d4f-4bda-9421-b4fd144ed562',
    code: 'CLT',
    name: 'Cluster',
    iconPath: '1754568122475-network.png',
    assetCategoryId: '7f579eb8-f716-4299-ad49-76c3e4b88d5d',
    isShareable: true,
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
    id: '73653588-26be-40bd-8881-320f283038d7',
    code: 'CLI',
    name: 'Client',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: '4bc87393-9343-42f7-bbc0-f296c22582a2',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"Client","description":"Client asset specifications","type":"object","properties":{"DeviceType":{"description":"Type of the client device.","type":"string","minLength":1,"enum":["PC","Laptop","ThinClient","ZeroClient","AllInOne","Tablet","Mobile"]},"DeviceName":{"description":"Assigned name to the client device.","type":"string"},"Network":{"description":"Details about Network addresses","type":"object","properties":{"IPAddress":{"description":"Assigned IP address","type":"string","minLength":1,"pattern":"^(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}$|^$"},"Zone":{"description":"Network Zone where IP is valid","type":"string","enum":["NSS","NIBN","Nasim","OEdge","BDC","CDC","TA-ODC","BI-EDW","Novin","Hafez","Infra","Mavara","Iranet","Other"]},"MACAddress":{"description":"The physical address of the device for network identification.","type":"string","pattern":"^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$|^$"},"Domain":{"description":"The Domain of the network.","type":"string","minLength":1}},"required":["IPAddress","Domain"]},"ConnectionStatus":{"description":"Connection status of the device.","type":"string","enum":["Connected","Disconnected","Connecting"]},"DeviceStatus":{"description":"Status of the device.","type":"string","enum":["Active","Inactive","Repairing","Under Maintenance"]},"User":{"description":"Users used to log into the client device.","type":"array","minItems":1,"items":{"type":"object","properties":{"Username":{"type":"string"},"IsAdmin":{"type":"boolean"}}}},"Hardware":{"description":"Hardware specifications of the device.","type":"object","properties":{"CPU":{"description":"Type and speed of the processor.","type":"string"},"RAM":{"description":"Capacity and type of RAM.","type":"string"},"Storage":{"description":"Type and capacity of storage.","type":"string"},"GPU":{"description":"Type and model of the graphics card.","type":"string"}}},"AccessType":{"description":"Access type to the network.","type":"string","enum":["Direct","VPN","Wi-Fi"]},"InstallationDate":{"description":"Date of purchase or installation.","type":"string","format":"date"},"LastUpdateDate":{"description":"Date of the last software or OS update.","type":"string","format":"date"}},"required":["DeviceType","Network","User"]}',
      archived: false,
      hasLocation: true,
      locationTypeNames: ['Main Site', 'Data Center'],
      version: 1,
    },
  },
  // {
  //   id: 'a4f9e2cb-b2e1-46ee-8137-3ff269c0d707',
  //   code: 'SWL',
  //   name: 'Software License',
  //   iconPath: null,
  //   assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
  //   isShareable: false,
  //   assetTypeVersion: {
  //     id: '91b33674-22ea-492e-a9e1-3b2b54944823',
  //     content:
  //       '{"$schema":"http://json-schema.org/schema#","title":"Software License","type":"object","properties":{"LicenseType":{"type":"string","minLength":1,"enum":["Perpetual","SubscriptionBased","OpenSource"]},"AtivationCode":{"type":"string","description":"Code used to activate the software"},"StartDate":{"type":"string","format":"date","description":"License start date"},"ExpirationDate":{"type":"string","format":"date","description":"License expiration date"},"AuthorizedUsersOrDevices":{"type":"integer","description":"Number of users or devices allowed under the license"},"UsageLocation":{"type":"string","description":"Location or branch using the license"},"SoftwareName":{"type":"string","description":"Name of the software or product covered by the license"},"LicenseDetails":{"type":"string","description":"Additional details about the license type and features"},"RenewalOrReviewDate":{"type":"string","format":"date","description":"Dates when the license needs renewal or review","metadata":{"eventType":"key_end_of_life_email","identifier":"7658c2f0-c778-4278-9030-d464e069dafc"}},"SupportLevel":{"type":"string","enum":["24/7","Email","Phone"],"description":"Support level provided"},"LicenseProvider":{"type":"string","description":"Company or individual who issued the license"},"GeographicalRestrictions":{"type":"string","description":"Geographic locations where the license is valid"},"AdditionalModulesLicense":{"type":"string","description":"Modules or features covered under this license"},"LicenseCost":{"type":"integer","description":"Cost of the license or renewal"},"ActivationStatus":{"type":"string","enum":["Active","Inactive","Expired"],"description":"Current status of the license"},"RefundOrCancellationPolicy":{"type":"string","description":"Refund or cancellation terms"},"LicenseOwner":{"type":"string","description":"Individual or organization owning the license"},"ContractType":{"type":"string","enum":["SaaS","OnPremises"],"description":"Type of contract related to the license"},"ConcurrentLicenses":{"type":"integer","description":"Number of users allowed to use the license concurrently"},"PurchaseDate":{"type":"string","format":"date","description":"Date of purchase or acquisition of the license"},"LicenseDuration":{"type":"integer","description":"Duration of the license in years"},"SupportContactDetails":{"type":"string","description":"Contact information for technical support or license renewal"},"TermsAndConditions":{"type":"string","description":"Terms and conditions related to the license"},"SoftwareVersion":{"type":"string","description":"Software version for which the license is valid"},"AttachedDocuments":{"type":"array","items":{"type":"string","description":"URLs or file paths to related documents like PDFs or contracts"}}},"required":["LicenseType"]}',
  //     archived: false,
  //     hasLocation: false,
  //     version: 1,
  //   },
  // },
  // {
  //   id: 'c2e5e2e5-b664-4f4d-bf6f-22592b0bd129',
  //   code: 'ENK',
  //   name: 'Encryption Key',
  //   iconPath: null,
  //   assetCategoryId: 'd1307e1e-52f3-44ae-bc25-e7663bafd4ad',
  //   isShareable: false,
  //   assetTypeVersion: {
  //     id: '0b1e0b25-3bcd-4d8d-85fe-9d715cab2d6e',
  //     content:
  //       '{"$schema":"http://json-schema.org/schema#","title":"Encryption Key","type":"object","properties":{"KeyName":{"type":"string","description":"Unique name or identifier of the encryption key"},"KeyType":{"type":"string","enum":["Symmetric","Asymmetric"],"description":"Type of encryption key"},"EncryptionAlgorithm":{"type":"string","enum":["AES","RSA","ECC","DES","3DES","Blowfish","ChaCha20"],"description":"Encryption algorithm used"},"KeyLength":{"type":"integer","description":"Length of the encryption key in bits"},"KeyGenerationDate":{"type":"string","format":"date","description":"Date when the encryption key was generated"},"ValidityStartDate":{"type":"string","format":"date","description":"Start date of the key validity period"},"ValidityEndDate":{"type":"string","format":"date","description":"End date of the key validity period","metadata":{"eventType":"expiration_license_sms","identifier":"4982bdb8-d847-4a76-94de-207a2613ede5"}},"KeyStatus":{"type":"string","enum":["Active","Inactive","Expired","Revoked","Compromised"],"description":"Current status of the encryption key"},"KeyUsage":{"type":"string","enum":["Encryption","Decryption","Signing","Verification","KeyExchange"],"description":"Purpose of the encryption key"},"BackupAvailable":{"type":"boolean","description":"Indicates whether a backup of the key exists"},"Description":{"type":"string","description":"Additional details about the encryption key"}},"required":["KeyName","KeyType","EncryptionAlgorithm","KeyLength","KeyGenerationDate","ValidityStartDate","ValidityEndDate","KeyStatus","KeyUsage"]}',
  //     archived: false,
  //     hasLocation: false,
  //     version: 1,
  //   },
  // },
  {
    id: 'ca0a4812-dbf4-44ca-b4f4-32fdb39f3827',
    code: 'LSC',
    name: 'Log Source',
    iconPath: null,
    assetCategoryId: '975b2b0f-9a54-4307-b6b6-f94db422cd58',
    isShareable: false,
    assetTypeVersion: {
      id: 'dee0e645-dbbd-4226-9a12-e1e783c9bbb4',
      content:
        '{"$schema":"http://json-schema.org/schema#","title":"LogSource","description":"Qradar LogSource specifications","type":"object","properties":{"HostName":{"description":"Assigned host name to logging","type":"string","minLength":1,"metadata":{"isSearchable":true}},"IPAddress":{"description":"IP addresses used for network","type":"string","minLength":1,"pattern":"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$|^$","metadata":{"isSearchable":true}},"Type":{"type":"object","description":"Type of LogSource binded Asset","minLength":1,"properties":{"ID":{"type":"number","minLength":1},"Name":{"type":"string","minLength":1}},"required":["ID","Name"],"metadata":{"isSearchable":true,"isSelectable":true,"backendURL":"/asset-management/api/v1/asset/log-source/types","isMulti":false,"label":"Name"}},"ProtocolType":{"type":"object","description":"Log Sending Protocol","minLength":1,"properties":{"ID":{"type":"number","minLength":1},"Name":{"type":"string","minLength":1}},"metadata":{"isSearchable":true,"isSelectable":true,"dependsOn":["Type.ID"],"backendURL":"/asset-management/api/v1/asset/log-source/[Type.ID]/protocol","isMulti":false,"label":"Name"}},"QradarGroup":{"type":"object","description":"Qradar User Group","minLength":1,"properties":{"ID":{"type":"number","minLength":1},"Name":{"type":"string","minLength":1}},"metadata":{"isSearchable":true,"isSelectable":true,"backendURL":"/asset-management/api/v1/asset/log-source-groups","isMulti":false,"label":"Name"}},"Status":{"description":"Current status of LogSource.","type":"string","enum":["Enabled","Disabled"],"metadata":{"isSearchable":true}}},"required":["HostName","IPAddress","Type","ProtocolType","QradarGroup","Status"]}',
      archived: false,
      hasLocation: false,
      version: 1,
      classification: AssetTypeClassificationEnum.LogSource,
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
