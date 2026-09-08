export const storageTemplates = [
  {
    name: 'NAME**',
    type: 'string',
    required: true,
  },
  {
    name: 'STORAGE_TYPE*',
    type: 'string',
    required: true,
  },
  {
    name: 'STORAGE_CAPACITY(GB)*',
    type: 'number',
    required: false, // TODO : change to true later
  },
  {
    name: 'MANUFACTURER*',
    type: 'string',
    required: true,
  },
  {
    name: 'MODEL*',
    type: 'string',
    required: true,
  },
  {
    name: 'SERIAL_NO',
    type: 'string',
    required: false,
  },
  {
    name: 'NETWORK_ZONE*',
    type: 'string',
    required: false, // TODO : change to true later
  },
  {
    name: 'NETWORK_MANAGEMENT_IP**',
    type: 'any',
    required: true,
  },
  {
    name: 'NETWORK_MAC',
    type: 'any',
    required: false,
  },
  {
    name: 'NETWORK_OTHER_IPS',
    type: 'string',
    regex:
      /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]))(\s*[;,]\s*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])))*$/,
    required: false,
  },
  {
    name: 'STATE',
    type: 'string',
    required: false,
  },
  {
    name: 'LOCATION*',
    type: 'string',
    required: true,
  },
  {
    name: 'ACCOUNTABLE_USER*',
    type: 'string',
    required: true,
  },
  {
    name: 'RESPONSIBLE_USER*',
    type: 'string',
    required: true,
  },
];
