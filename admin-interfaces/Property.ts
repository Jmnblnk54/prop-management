export interface PropertyDoc {
  id: string;
  adminId: string;
  name?: string;
  addressLine1: string;
  addressLine2?: string; // suite / unit; optional on property
  city: string;
  state: string;
  zip: string;
  createdAt?: any;
}
