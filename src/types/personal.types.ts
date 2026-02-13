export interface LinearStaff {
  lsid: string;
  fio: string;
  doe: string;
  pos_id: number | null;
}

export interface Position {
  id: number;
  hid: string;
  name: string;
  lsid: string | null;
}

export interface StaffInfo {
  id: number;
  type: string;
  label: string;
  value: string;
  lsid: string;
}

export interface PersonalState {
  staff: LinearStaff[];
  positions: Position[];
  positionsByHid: Record<string, Position[]>;
  staffInfo: Record<string, StaffInfo[]>;
  loading: boolean;
  error: string | null;
  selectedHierarchyId: string | null;
}