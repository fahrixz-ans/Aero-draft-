export interface QrisData {
  merchantName: string;
  nmid?: string;
  city?: string;
  imageUrl: string;
}

export interface BankAccountData {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

export interface DonationConfigData {
  enabled: boolean;
  minAmount?: number;
  description?: string;
  qris?: QrisData;
  banks?: BankAccountData[];
}
