import { NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { AssetTypeVersion } from 'src/asset-type/entities/asset-type-version.entity';
import { AssetType } from 'src/asset-type/entities/asset-type.entity';
import { AssetVersion } from 'src/asset/entities/asset-version.entity';
import { Asset } from 'src/asset/entities/asset.entity';
import { AssetStatusEnum } from 'src/common/enums/asset-status.enum';
import { User } from 'src/users/entities/user.entity';
import { Vault } from 'src/vault/vault';
import { DataSource } from 'typeorm';
import { clusterAssets } from './cluster-assets';
import { osAssets } from './os-assets';

export const assetSeeder = async (datasource: DataSource) => {
  const assets = [...clusterAssets, ...osAssets];
  // const assetType = await datasource.getRepository(Asset).find({
  //   where: { assetType: { name: 'Operating System' } },
  //   select: {
  //     id: true,
  //     referenceId: true,
  //     name: true,
  //     assetTypeId: true,
  //     description: true,
  //     externalRefId: true,
  //     assetVersions: {
  //       id: true,
  //       version: true,
  //       baseline: true,
  //       content: true,
  //       status: true,
  //       accountableId: true,
  //       editorId: true,
  //       archived: true,
  //       assetTypeVersion: true,
  //     },
  //   },
  //   relations: {
  //     assetVersions: true,
  //     assetType: true,
  //   },
  // });

  // const a: any[] = [];
  // for (let i = 0; i < assetType.length; i++) {
  //   const element = assetType[i];
  //   if (element.assetVersions) {
  //     if (element.assetVersions.length !== 1) {
  //       console.log('multiple versions', element.id);
  //     }
  //     a.push({
  //       ...element,
  //       assetVersion: element.assetVersions[0],
  //       assetVersions: undefined,
  //       assetType: undefined,
  //     });
  //   } else {
  //     console.log('no version');
  //   }
  // }
  // console.log(JSON.stringify(a));

  const usernames: string[] = [];
  for (let i = 0; i < assets.length; i++) {
    const element = assets[i];
    const asset = await datasource.getRepository(Asset).findOne({
      where: [
        {
          name: element.name,
          assetType: { name: element.assetType },
        },
        { id: element.id },
      ],
      relations: { assetType: true },
    });

    if (asset) {
      if (asset.id !== element.id) {
        console.log(
          `asset id does not match ${JSON.stringify({
            assetType: asset.id,
            id: element.id,
            name: element.name,
            code: element.assetType,
          })}`,
        );
      }
      continue;
    }

    usernames.push(element.assetVersion.accountable);
    usernames.push(element.assetVersion.editor);
  }

  const uniqueUsernames = [...new Set(usernames)];

  const userData: Record<string, string> = {};

  await getUsers(uniqueUsernames, userData, datasource);

  for (let i = 0; i < assets.length; i++) {
    const element = assets[i];

    const assetType = await datasource
      .getRepository(AssetType)
      .findOne({ where: { name: element.assetType } });

    if (!assetType) {
      console.log(element.assetType);
      throw new NotFoundException('assetType');
    }

    const assetTypeVersion = await datasource
      .getRepository(AssetTypeVersion)
      .findOne({
        where: {
          version: element.assetVersion.version,
          assetTypeId: assetType.id,
        },
      });

    if (!assetTypeVersion) {
      console.log(
        `asset type version does not match ${JSON.stringify({
          assetTypeId: assetType.id,
          version: element.assetVersion.version,
        })}`,
      );
      throw new NotFoundException('assetTypeVersion');
    }

    const asset = await datasource
      .getRepository(Asset)
      .save({ ...element, assetTypeId: assetType.id, assetType: undefined });

    await datasource.getRepository(AssetVersion).save({
      id: element.assetVersion.id,
      version: element.assetVersion.version,
      baseline: element.assetVersion.baseline,
      content: element.assetVersion.content,
      status: element.assetVersion.status as AssetStatusEnum,
      archived: element.assetVersion.archived,
      // locationNames?: element.assetVersion |
      assetId: asset.id,
      accountableId: userData[element.assetVersion.accountable],
      editorId: userData[element.assetVersion.editor],
      assetTypeVersionId: assetTypeVersion.id,
    });
  }

  return true;
};

const getUsers = async (
  uniqueUsernames: string[],
  userData: Record<string, string>,
  datasource: DataSource,
) => {
  let IDP_SERVICE_INTERNAL_TOKEN, IDP_SERVICE_URL;
  try {
    IDP_SERVICE_INTERNAL_TOKEN = await Vault.instance.get(
      'IDP_SERVICE_INTERNAL_TOKEN',
      'share',
    );

    IDP_SERVICE_URL = await Vault.instance.get('IDP_SERVICE_URL');
  } catch (err) {
    console.log("couldn\'t fetch Env Variables from vault in os seeder", err);
    return false;
  }

  for (let i = 0; i < uniqueUsernames.length; i++) {
    const username = uniqueUsernames[i];
    try {
      const params = new URLSearchParams({
        ADUserName: `iranet\\${username}`,
      });

      const { data } = await axios.get<{ data: { EmployeeId: string }[] }>(
        `${IDP_SERVICE_URL}/idp/api/v1/auth/get-all-employees-internal`,
        {
          params,
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
            Accept: 'application/json',
          },
        },
      );

      if (!data.data[0]) {
        console.log(`user with username ${username} not found`);
        continue;
      }

      const { data: idpData } = await axios.post<{
        data: { id: string; isEnable: boolean };
      }>(
        `${IDP_SERVICE_URL}/idp/api/v1/users`,
        { domain: 'iranet', employeeId: data.data[0].EmployeeId },
        {
          headers: {
            'x-internal-communication-token': IDP_SERVICE_INTERNAL_TOKEN,
          },
        },
      );

      const user = await datasource.getRepository(User).findOne({
        where: {
          id: idpData.data.id,
        },
      });

      if (!user) {
        await datasource.getRepository(User).save({
          id: idpData.data.id,
          isEnable: idpData.data.isEnable,
        });
      }

      userData[username] = idpData.data.id;
    } catch (err) {
      console.log("couldn\'t fetch User Info in os seeder", err);
    }
  }
};
