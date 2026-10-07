export interface OfficeHours {
  officeStartTime: string;
  officeEndTime: string;
}

export interface LocationRestrictionSetting {
  enabled: boolean;
}

export interface LatePolicy {
  officeStartTime: string;
  graceMinutes: number;
  latesPerDeduction: number;
}
