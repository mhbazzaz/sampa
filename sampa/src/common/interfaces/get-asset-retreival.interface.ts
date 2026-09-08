export interface AssetInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _v: number;
  referenceId: string;
  externalRefId: string;
  accountableUnitId: string;
  accountableId: string;
  editorId: string;
  editorUnitId: string | null;
  baseline: string;
  name: string;
  content: string;
  assetTypeId: string;
  assetType: AssetTypeInterface;
  filterValues: any[];
}

export interface AssetTypeInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _v: number;
  code: string;
  name: string;
  content: string;
  assetCategoryId: string;
  assetCategory: AssetCategoryInterface;
}

export interface AssetCategoryInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _v: number;
  name: string;
}
