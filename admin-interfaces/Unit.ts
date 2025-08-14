
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
