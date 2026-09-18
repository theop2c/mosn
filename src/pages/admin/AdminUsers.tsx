import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { AdminTabs } from "../../components/AdminTabs";
import { useAuth } from "../../context/AuthContext";
import type { AdminUser } from "../../types";

export function AdminUsers() {
  const { user, t } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.loadFailed);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(path: string, body: Record<string, unknown>, uid: string) {
    setBusy(uid);
    setError(null);
    try {
      await api(path, { body });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <AdminTabs />
      <h1>{t.admin.usersTitle}</h1>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>{t.admin.thName}</th>
            <th>{t.admin.thEmail}</th>
            <th>{t.admin.thRole}</th>
            <th>{t.admin.thStatus}</th>
            <th>{t.admin.thActions}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.displayName ?? "—"}</td>
              <td>{u.email ?? "—"}</td>
              <td>{u.admin ? t.admin.roleAdmin : t.admin.roleUser}</td>
              <td>{u.disabled ? t.admin.statusBanned : t.admin.statusActive}</td>
              <td>
                {u.uid !== user?.uid && (
                  <>
                    <button
                      className="link"
                      disabled={busy === u.uid}
                      onClick={() =>
                        toggle(
                          "/api/admin/set-role",
                          { uid: u.uid, admin: !u.admin },
                          u.uid,
                        )
                      }
                    >
                      {u.admin ? t.admin.demote : t.admin.promote}
                    </button>{" "}
                    <button
                      className="link danger"
                      disabled={busy === u.uid}
                      onClick={() =>
                        toggle(
                          "/api/admin/ban-user",
                          { uid: u.uid, banned: !u.disabled },
                          u.uid,
                        )
                      }
                    >
                      {u.disabled ? t.admin.unban : t.admin.ban}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
