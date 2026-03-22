
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

export interface UnitDetails {
  id?: string;
  unitNumber: string;

  tenantEmail?: string | null;
  tenantName?: string | null;
  phone?: string | null;
  notes?: string | null;

  rentMonthly?: number | null;
  rentDueDay?: number | null;
  leaseStartDate?: any | null;
  leaseEndDate?: any | null;
  monthToMonth?: boolean | null;
  noticeTimeframeMonths?: number | null;
  leaseOnFile?: boolean | null;

  createdAt?: any;
}
