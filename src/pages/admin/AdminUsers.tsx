import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import type { AdminUser } from "../../types";

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }, []);

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
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <nav className="tabs">
        <NavLink to="/admin/users">Utilisateurs</NavLink>
        <NavLink to="/admin/reports">Signalements</NavLink>
      </nav>
      <h1>Utilisateurs</h1>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.displayName ?? "—"}</td>
              <td>{u.email ?? "—"}</td>
              <td>{u.admin ? "admin" : "user"}</td>
              <td>{u.disabled ? "banni" : "actif"}</td>
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
                      {u.admin ? "Rétrograder" : "Promouvoir admin"}
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
                      {u.disabled ? "Débannir" : "Bannir"}
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
