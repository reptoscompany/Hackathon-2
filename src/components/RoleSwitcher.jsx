import { ShieldCheck } from 'lucide-react';
import { ROLES, useRole } from '@/services/RoleContext';

/** Simulated RBAC switcher (in-memory). Analyst sees anonymized data. */
export function RoleSwitcher({ compact = false }) {
  const { roleId, setRoleId, role } = useRole();

  return (
    <label
      className={`flex items-center gap-2 ${compact ? '' : 'border border-[var(--color-border)] rounded-md px-2.5 py-1.5 bg-[var(--color-surface)]'}`}
      title={role.description}
    >
      <ShieldCheck className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" aria-hidden="true" />
      <span className="sr-only">Active role (simulated)</span>
      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="!w-auto !border-0 !p-0 !shadow-none text-sm font-medium bg-transparent cursor-pointer focus:ring-0"
        aria-label="Active role, simulated"
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label} (simulated)
          </option>
        ))}
      </select>
    </label>
  );
}
