export const clientTemplates = [
  {
    name: 'DEVICE_TYPE*',
    type: 'string',
    required: true,
  },
  {
    name: 'DEVICE_NAME**',
    type: 'string',
    required: true,
  },
  {
    name: 'USER_NAME*',
    type: 'string',
    required: true,
  },
  {
    name: 'USER_IS_ADMIN*',
    type: 'string',
    required: true,
  },
  {
    name: 'NETWORK_DOMAIN*',
    type: 'string',
    required: true,
  },
  {
    name: 'NETWORK_ZONE*',
    type: 'string',
    required: false, // TODO : change to true later
  },
  {
    name: 'NETWORK_IP**',
    type: 'string',
    // regex:
    //   /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})(\s*;\s*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))*$/,
    required: true,
  },
  {
    name: 'NETWORK_MAC*',
    type: 'string',
    // regex:
    //   /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})([;.][0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})*$/,
    required: true,
  },
  {
    name: 'DEVICE_RAM(GB)',
    type: 'number',
    required: false,
  },
  {
    name: 'DEVICE_CPU_MODEL',
    type: 'string',
    required: false,
  },
  {
    name: 'DEVICE_CPU_FREQ(GHz)',
    type: 'any',
    required: false,
  },
  {
    name: 'DEVICE_STORAGE(GB)',
    type: 'number',
    required: false,
  },
  {
    name: 'OS_TYPE_VERSION*',
    type: 'string',
    required: true,
  },
  {
    name: 'SOFTWARE_SERVICES_NAME',
    type: 'string',
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
