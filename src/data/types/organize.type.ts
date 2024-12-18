export interface Organize {
    status: string;
    data: OrganizeUser[];
  }
  
  export interface OrganizeUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    idNumber: string;
    password: string;
    isActive: boolean | null;
    role: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
    leaderId: number;
  }