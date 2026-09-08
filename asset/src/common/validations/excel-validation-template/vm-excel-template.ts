export const vmTemplates = [
  {
    name: 'NAME*',
    type: 'string',
    required: true,
  },
  {
    name: 'IP',
    type: 'string',
    regex:
      /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})(\s*[;,]\s*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))*$/,
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
    name: 'STORAGE(GB)*',
    type: 'number',
    required: true,
  },
  {
    name: 'OS_TYPE_VERSION',
    type: 'string',
    required: false,
  },
  {
    name: 'SERVICE_NAME',
    type: 'string',
    required: false,
  },
  {
    name: 'CLUSTER_NAME',
    type: 'string',
    required: false,
  },
  {
    name: 'VIRTUAL_LOCATION*',
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
