export const socTemplates = [
  {
    name: 'Logsource ID',
    type: 'number',
    required: true,
  },
  {
    name: 'Logsource Name',
    type: 'string',
    required: true,
  },
  {
    name: 'Host Name',
    type: 'string',
    required: true,
  },
  {
    name: 'IP',
    type: 'string',
    regex:
      /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/,
    required: true,
  },
  {
    name: 'Device Type',
    type: 'any',
    required: false,
  },
  {
    name: 'Device Model - OS Version',
    type: 'string',
    required: false,
  },
  {
    name: 'Service',
    type: 'string',
    required: false,
  },
  {
    name: 'Site',
    type: 'string',
    required: false,
  },
  {
    name: 'PCI Category',
    type: 'any',
    // enum: ['CAT1', 'CAT2', 'CAT 1,2'],
    required: false,
  },
  {
    name: 'Network Connection',
    type: 'string',
    enum: ['b-edge', 'o-edge', 'o-edge, Internet-Connect'],
    required: false,
  },
  {
    name: 'Logsource Identifier',
    type: 'string',
    required: false,
  },
  {
    name: 'Log Source Type',
    type: 'string',
    required: true,
  },
  {
    name: 'User Group',
    type: 'string',
    required: false,
  },
  {
    name: 'Owner Group',
    type: 'string',
    required: false,
  },
];
