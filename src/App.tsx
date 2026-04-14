import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import AppLayout from "./pages/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import ReadLater from "./pages/ReadLater";
import Clusters from "./pages/Clusters";
import PagesView from "./pages/PagesView";
import { getUser } from "./store";
import "./styles.css";


function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getUser();
  // Allow access even without auth for demo purposes (remove for production gate)
  return <>{children}</>;
}

export default function App() {
  // Check for shared item URL
  const params = new URLSearchParams(window.location.search);
  const shareType = params.get("share");
  const shareTitle = params.get("title");
  if (shareType && shareTitle) {
    // Show a simple share preview before redirecting
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", flexDirection: "column", gap: "1rem", padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div className="logo-mark" style={{ margin: "0 auto 1rem", width: 48, height: 48, fontSize: "1.2rem" }}>C</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
            Someone shared a Clutch save
          </h2>
          <p style={{ color: "var(--text-2)", marginBottom: "1.5rem" }}>"{shareTitle}"</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <a href="/" className="btn btn-ghost btn-lg">← Back to home</a>
            <a href="/app" className="btn btn-primary btn-lg">Open in Clutch →</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="later" element={<ReadLater />} />
        <Route path="clusters" element={<Clusters />} />
        <Route path="pages" element={<PagesView />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SettingsPage() {
  const handleReset = () => {
    if (!confirm("This will clear all your saves and reset the app. Continue?")) return;
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div>
      <header className="topbar">
        <span className="topbar-title">Settings</span>
      </header>
      <div className="page" style={{ maxWidth: 600 }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Account</h3>
          <p className="muted small" style={{ marginBottom: "1rem" }}>Manage your account settings.</p>
          <button className="btn btn-ghost" onClick={() => { localStorage.removeItem("clutch_user"); window.location.href = "/"; }}>
            Sign out
          </button>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", color: "#991B1B" }}>Danger zone</h3>
          <p className="muted small" style={{ marginBottom: "1rem" }}>Reset all data and start fresh. This cannot be undone.</p>
          <button className="btn btn-danger" onClick={handleReset}>
            Reset all data
          </button>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Extension</h3>
          <p className="muted small" style={{ marginBottom: "1rem" }}>
            Download the Clutch Chrome extension to save anything from the web in one click.
          </p>
          <a href="/clutch-extension.zip" className="btn btn-primary" download>
            ↓ Download Extension
          </a>
          <p className="small muted" style={{ marginTop: "0.75rem" }}>
            After downloading: Chrome → Extensions → Developer mode → Load unpacked (extract zip first)
          </p>
        </div>
      </div>
    </div>
  );
}
