export const serverTemplates = [
  {
    name: 'NAME*',
    type: 'string',
    required: true,
  },
  {
    name: 'MODEL',
    type: 'string',
    required: false,
  },
  {
    name: 'IP',
    type: 'string',
    regex:
      /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})(\s*;\s*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))*$/,
    required: false,
  },
  {
    name: 'RAM(GB)*',
    type: 'number',
    required: true,
  },
  {
    name: 'CPU_CORES*',
    type: 'number',
    required: true,
  },
  {
    name: 'CPU_FREQ(GHz)',
    type: 'number',
    required: false,
  },
  {
    name: 'HYPERV_TYPE',
    type: 'any',
    required: false,
  },
  {
    name: 'HYPERV_VERSION',
    type: 'any',
    required: false,
  },
  {
    name: 'OS_TYPE',
    type: 'any',
    required: false,
  },
  {
    name: 'OS_VERSION',
    type: 'any',
    required: false,
  },
  {
    name: 'STORAGE_NAME',
    type: 'string',
    required: false,
  },
  {
    name: 'STORAGE_IP',
    type: 'string',
    regex:
      /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})(\s*;\s*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))*$/,
    required: false,
  },
  {
    name: 'CLUSTER_NAME',
    type: 'string',
    required: false,
  },
  {
    name: 'LOCATION*',
    type: 'string',
    required: true,
  },
  {
    name: 'ACCOUNTABLE*',
    type: 'string',
    required: true,
  },
  {
    name: 'RESPONSIBLE*',
    type: 'string',
    required: true,
  },
];
