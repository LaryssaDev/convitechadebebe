export interface Companion {
  id: string;
  firstName: string;
  lastName: string;
}

export type TransportType = 'van' | 'car';

export type InvitationType = 'weekend' | 'day' | 'pending';

export interface RSVP {
  id: string;
  firstName: string;
  lastName: string;
  hasCompanions: boolean;
  companionsCount: number;
  companions: Companion[];
  transport: TransportType;
  createdAt: string; // ISO string
  invitationType: InvitationType; // admin-defined: 'weekend' | 'day' | 'pending' (starts as 'pending' or default value)
}

export interface AdminStats {
  totalRSVPs: number; // main guests count
  totalPeople: number; // main guests + all companions
  byTransport: {
    van: number;
    car: number;
  };
  byInvitationType: {
    weekend: number;
    day: number;
    pending: number;
  };
  daysLeft: number;
}
