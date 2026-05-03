export interface AssetResponse {
  assetReferenceId: string;
  title: string | null;
  leadId: string; // The userId of the lead for the asset
  membersId: string[]; // Array of userIds who are members
}
