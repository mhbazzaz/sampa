export type IdpEmployee = {
  EmployeeId?: string;
  ADUserName?: string;
  adUserName?: string;
  Username?: string;
  username?: string;
  DepartmentId?: string;
  DepartmentName?: string;
  departmentId?: string;
  departmentName?: string;
  ManagementId?: string;
  ManagementName?: string;
  managementId?: string;
  managementName?: string;
  GroupId?: string;
  GroupName?: string;
  groupId?: string;
  groupName?: string;
};

export type ApplicantOrg = {
  deputyId: string;
  deputyName: string;
  managementId?: string;
  managementName?: string;
  groupId?: string;
  groupName?: string;
};

export type MemberIdentity = {
  id: string;
  username: string | null;
};

type OrgFilters = {
  deputyId?: string;
  managementId?: string;
  groupId?: string;
};

const firstPresent = (
  ...values: Array<string | undefined | null>
): string | undefined => values.find((value) => !!value) ?? undefined;

/**
 * HRMS AD names are `iranet\user`. SAMPA members store `user` only.
 */
export const normalizeAdUsername = (
  value?: string | null,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const withoutDomain = trimmed.includes('\\')
    ? trimmed.split('\\').filter(Boolean).pop() || trimmed
    : trimmed;

  return withoutDomain.toLowerCase();
};

export const toApplicantOrg = (
  employee: IdpEmployee,
): ApplicantOrg | undefined => {
  const deputyId = firstPresent(employee.DepartmentId, employee.departmentId);
  if (!deputyId) {
    return undefined;
  }

  return {
    deputyId,
    deputyName:
      firstPresent(employee.DepartmentName, employee.departmentName) || '-',
    managementId: firstPresent(employee.ManagementId, employee.managementId),
    managementName: firstPresent(
      employee.ManagementName,
      employee.managementName,
    ),
    groupId: firstPresent(employee.GroupId, employee.groupId),
    groupName: firstPresent(employee.GroupName, employee.groupName),
  };
};

export const extractNormalizedUsernames = (
  employees: IdpEmployee[],
): string[] => {
  const usernames = new Set<string>();

  for (const employee of employees) {
    const username = normalizeAdUsername(getEmployeeAdUsername(employee));
    if (username) {
      usernames.add(username);
    }
  }

  return Array.from(usernames);
};

/**
 * Org lookup keyed by SAMPA member id. EmployeeId / HRMS ids are never used
 * as keys — members are matched only by normalized AD username.
 */
export const buildMemberOrgLookup = (
  members: MemberIdentity[],
  employees: IdpEmployee[],
): Map<string, ApplicantOrg> => {
  const orgByUsername = new Map<string, ApplicantOrg>();

  for (const employee of employees) {
    const org = toApplicantOrg(employee);
    const username = normalizeAdUsername(getEmployeeAdUsername(employee));
    if (!org || !username) {
      continue;
    }

    orgByUsername.set(username, org);
  }

  const lookup = new Map<string, ApplicantOrg>();

  for (const member of members) {
    const username = normalizeAdUsername(member.username);
    if (!username) {
      continue;
    }

    const org = orgByUsername.get(username);
    if (org) {
      lookup.set(member.id, org);
    }
  }

  return lookup;
};

export const resolveApplicantOrg = (
  lookup: Map<string, ApplicantOrg>,
  applicantId: string,
): ApplicantOrg | undefined => lookup.get(applicantId);

export const matchesOrgFilters = (
  org: ApplicantOrg,
  filters: OrgFilters,
): boolean => {
  if (filters.deputyId && org.deputyId !== filters.deputyId) {
    return false;
  }

  if (filters.managementId && org.managementId !== filters.managementId) {
    return false;
  }

  if (filters.groupId && org.groupId !== filters.groupId) {
    return false;
  }

  return true;
};

const getEmployeeAdUsername = (employee: IdpEmployee): string | undefined =>
  firstPresent(
    employee.ADUserName,
    employee.adUserName,
    employee.Username,
    employee.username,
  );
