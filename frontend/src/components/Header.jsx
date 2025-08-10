import { useAuth } from "../AuthContext";
import { apiPost } from "../requestHelper";

export default function Header() {
  const { user, roles, schools, active_role, active_school, logout, reloadSession } = useAuth();

  async function switchRole(e) {
    const value = e.target.value; // role|school_id
    const [role, school_id] = value.split("|");
    try {
      await apiPost("/auth/preference", { role, school_id });
      await reloadSession();
    } catch (err) {
      console.error("Failed to switch role", err);
    }
  }
  return (
    <div style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontWeight: 600 }}>Header</div>
      {user ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{user.first_name} {user.last_name}</span>
          {roles?.length > 0 && (
            <select onChange={switchRole} value={`${active_role || ''}|${active_school || ''}`} style={{ padding: 6 }}>
              {roles.map(r => (
                <option key={`${r.role}|${r.school_id}`} value={`${r.role}|${r.school_id}`}>
                  {r.role} @ {schools.find(s => String(s.id) === String(r.school_id))?.name || 'School'}
                </option>
              ))}
            </select>
          )}
          <button onClick={logout} style={{ padding: '6px 12px' }}>Logout</button>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

