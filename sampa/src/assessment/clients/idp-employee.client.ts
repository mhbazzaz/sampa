import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { Vault } from 'src/vault/vault';
import { RemainedVulnerabilityReportFilterDto } from '../dto/input/remained-vulnerability-report-filter.dto';
import { IdpEmployee } from '../helpers/idp-employee-org.helper';

type EmployeeOrgQuery = Pick<
  RemainedVulnerabilityReportFilterDto,
  'deputyId' | 'managementId' | 'groupId'
>;

const IDP_TIMEOUT_MS = 15_000;

@Injectable()
export class IdpEmployeeClient {
  private readonly logger = new Logger(IdpEmployeeClient.name);

  async findEmployees(filters: EmployeeOrgQuery = {}): Promise<IdpEmployee[]> {
    try {
      const [token, baseUrl] = await Promise.all([
        Vault.instance.get('IDP_SERVICE_INTERNAL_TOKEN', 'share'),
        Vault.instance.get('IDP_SERVICE_URL'),
      ]);

      const { data } = await axios.get(
        `${baseUrl}/idp/api/v1/auth/get-all-employees-internal-without-paginate`,
        {
          timeout: IDP_TIMEOUT_MS,
          params: {
            GetInternalUsers: true,
            ...(filters.deputyId && { DepartmentId: filters.deputyId }),
            ...(filters.managementId && { ManagementId: filters.managementId }),
            ...(filters.groupId && { GroupId: filters.groupId }),
          },
          headers: {
            'x-internal-communication-token': token,
            accept: '*/*',
          },
        },
      );

      return Array.isArray(data?.data) ? (data.data as IdpEmployee[]) : [];
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch IDP employees: ${axiosError.message}`,
        axiosError.stack,
      );
      throw new InternalServerErrorException(
        'Failed to resolve employee organization data',
      );
    }
  }
}
