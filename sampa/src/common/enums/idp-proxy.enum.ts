export enum IdpProxyTypeEnum {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
}

export enum IdpProxyDestinationEnum {
  AUTHENTICATION = 'ACTIVE_DIRECTORY',
  HRMS = 'HRMS',
}

export enum IdpProxyServiceEnum {
  AUTHENTICATION = 'GET_EMPLOYEE_BY_USERNAME',
  HRMS = 'LOGIN',
}
