import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut(auth);
    navigate("/");
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          MOSN
        </Link>
        <nav>
          <NavLink to="/">Fil</NavLink>
          {user && <NavLink to={`/u/${user.uid}`}>Profil</NavLink>}
          {isAdmin && <NavLink to="/admin/users">Admin</NavLink>}
          {user ? (
            <button className="link" onClick={handleSignOut}>
              Déconnexion
            </button>
          ) : (
            <NavLink to="/login">Connexion</NavLink>
          )}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <a
          href="https://github.com/theop2c/mosn"
          target="_blank"
          rel="noreferrer"
        >
          MOSN — open source (GPL-3.0)
        </a>
      </footer>
    </div>
  );
}
