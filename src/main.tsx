import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { isConfigured } from "./lib/firebase";
import { Install } from "./pages/Install";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      // Premier déploiement sans variables d'environnement :
      // on affiche l'assistant d'installation.
      <Install />
    )}
  </StrictMode>,
);
