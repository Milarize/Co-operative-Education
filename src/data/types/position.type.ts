export interface Position {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  deletedAt?: string | null;
}
