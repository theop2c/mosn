import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { Conversation } from "./pages/Conversation";
import { Feed } from "./pages/Feed";
import { Group } from "./pages/Group";
import { Groups } from "./pages/Groups";
import { Login } from "./pages/Login";
import { Messages } from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";
import { Search } from "./pages/Search";

export default function App() {
  const { loading } = useAuth();
  if (loading) return <p className="center">Chargement…</p>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Feed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/u/:uid" element={<Profile />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/search" element={<Search />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/g/:gid" element={<Group />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:uid" element={<Conversation />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
