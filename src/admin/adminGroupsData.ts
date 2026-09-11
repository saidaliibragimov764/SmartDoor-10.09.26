// Group-based admin management system with localStorage persistence

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  telegram: string;
  phone: string;
  groupId: string;
  login: string;
  password: string;
  role: "staff";
}

export interface AdminGroup {
  id: string;
  name: string;
}

export interface GroupsState {
  groups: AdminGroup[];
  users: AdminUser[];
}

const LS_KEY = "smartdoor_admin_groups";

export function loadGroupsState(): GroupsState {
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return { groups: [], users: [] };
}

export function saveGroupsState(state: GroupsState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}
