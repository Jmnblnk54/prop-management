
export interface Unit {
  unitId: string;
  leased: boolean;
  leaseExpiration: string;
  tenantEmail?: string;
  insuranceStatus: "verified" | "unverified" | "pending";
  leaseFileUrl?: string;
}

export interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  units: Unit[];
}

export interface UnitDoc {
  id: string;
  adminId: string;
  propertyId: string;
  unitNumber: string;
  rent?: number;
  tenantId?: string;
  insuranceStatus?: 'submitted' | 'verified' | 'rejected' | null;
  createdAt?: any;
}
