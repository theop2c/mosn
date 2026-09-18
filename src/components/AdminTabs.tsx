import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminTabs() {
  const { t } = useAuth();
  return (
    <nav className="tabs">
      <NavLink to="/admin/users">{t.admin.tabUsers}</NavLink>
      <NavLink to="/admin/invites">{t.admin.tabInvites}</NavLink>
      <NavLink to="/admin/reports">{t.admin.tabReports}</NavLink>
      <NavLink to="/admin/settings">{t.admin.tabSettings}</NavLink>
    </nav>
  );
}
