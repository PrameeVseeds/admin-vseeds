export interface Bank {
  id?: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankResponse {
  status: boolean;
  message: string;
  data: Bank | Bank[];
}
