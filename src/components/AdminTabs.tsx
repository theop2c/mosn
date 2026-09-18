import { NavLink } from "react-router-dom";

export function AdminTabs() {
  return (
    <nav className="tabs">
      <NavLink to="/admin/users">Utilisateurs</NavLink>
      <NavLink to="/admin/reports">Signalements</NavLink>
      <NavLink to="/admin/settings">Paramètres</NavLink>
    </nav>
  );
}
