export interface LogSourceType {
  id: number;
  name: string;
  internal: boolean;
  protocol_types: {
    protocol_id: number;
    documented: boolean;
  }[];
  identifier_field: string | null;
}
