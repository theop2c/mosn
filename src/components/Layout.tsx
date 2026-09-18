import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const siteName = import.meta.env.VITE_SITE_NAME || "MOSN";
const siteEnv = import.meta.env.VITE_SITE_ENV;

export function Layout() {
  const { user, isAdmin, t } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut(auth);
    navigate("/");
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          {siteName}
        </Link>
        {siteEnv && siteEnv !== "production" && (
          <span className="badge env">{siteEnv}</span>
        )}
        <nav>
          <NavLink to="/">{t.nav.feed}</NavLink>
          {user && <NavLink to="/search">{t.nav.search}</NavLink>}
          {user && <NavLink to="/groups">{t.nav.groups}</NavLink>}
          {user && <NavLink to="/messages">{t.nav.messages}</NavLink>}
          {user && <NavLink to={`/u/${user.uid}`}>{t.nav.profile}</NavLink>}
          {isAdmin && <NavLink to="/admin/users">{t.nav.admin}</NavLink>}
          {user ? (
            <button className="link" onClick={handleSignOut}>
              {t.nav.logout}
            </button>
          ) : (
            <NavLink to="/login">{t.nav.login}</NavLink>
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
