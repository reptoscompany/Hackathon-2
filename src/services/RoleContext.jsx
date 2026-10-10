import { createContext, useContext, useMemo, useState } from 'react';

const RoleContext = createContext(null);

export const ROLES = [
  { id: 'analyst', label: 'Analyst', description: 'Sees anonymized data. Victim and suspect fields masked.' },
  { id: 'sho', label: 'Station-House Officer', description: 'Sees full case details for own station incidents.' },
  { id: 'district', label: 'District Officer', description: 'Sees full case details across the district.' },
  { id: 'admin', label: 'Administrator', description: 'Full visibility plus audit and user management (simulated).' }
];

/** Simulated role switcher: in-memory only, visibly changes data visibility. */
export function RoleProvider({ children }) {
  const [roleId, setRoleId] = useState('analyst');
  const role = useMemo(() => ROLES.find((r) => r.id === roleId), [roleId]);

  const canSeeSensitive = roleId !== 'analyst';

  const maskIncident = (incident) => {
    if (canSeeSensitive) return incident;
    return {
      ...incident,
      victim_age_range: 'Masked',
      victim_gender: 'Masked',
      suspect_description: 'Masked for Analyst role (simulated)',
      investigating_officer: 'Masked'
    };
  };

  const value = useMemo(
    () => ({ roleId, role, setRoleId, canSeeSensitive, maskIncident }),
    [roleId, role, canSeeSensitive]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
}
