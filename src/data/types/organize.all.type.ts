export interface OrganizeAll {
  status: string;
  message: string;
  data: {
    [key: string]: OrganizeNode;
  };
}

export interface OrganizeNode {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  position: string;
  leaderId: number;
  subordinates: OrganizeNode[];
}
