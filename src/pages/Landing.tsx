import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../store";

type Mode = "home" | "signin" | "signup";

export default function Landing() {
  const [mode, setMode] = useState<Mode>("home");
  const navigate = useNavigate();

  if (mode === "signin") return <AuthPanel mode="signin" onSwitch={() => setMode("signup")} onBack={() => setMode("home")} onSuccess={() => navigate("/app")} />;
  if (mode === "signup") return <AuthPanel mode="signup" onSwitch={() => setMode("signin")} onBack={() => setMode("home")} onSuccess={() => navigate("/app")} />;

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src="/logo.png" alt="Clutch" style={{ height: 28, width: "auto" }} />
          Clutch
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setMode("signin")}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={() => setMode("signup")}>Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero">
        <img src="/logo.png" alt="Clutch" style={{ height: 72, width: "auto", marginBottom: "1.5rem" }} />
        <div className="hero-eyebrow">
          <span>✦</span> Now in early access
        </div>
        <h1 className="hero-title">
          Grab what matters.<br />
          <em>Return when it counts.</em>
        </h1>
        <p className="hero-sub">
          Clutch is a premium web clipper that saves anything in one click, groups it automatically with AI, and gives you a calm space to build on what you've collected.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-xl" onClick={() => setMode("signup")}>
            Start for free — no card needed
          </button>
          <button className="btn btn-ghost btn-xl" onClick={() => setMode("signin")}>
            Sign in
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="features-strip">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#D4EDE1" }}>⚡</div>
          <h3>One-click save</h3>
          <p>Clip any article, thread, video, or AI answer from anywhere with our browser extension. Zero friction.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#D4EDE1" }}>🧠</div>
          <h3>AI clustering</h3>
          <p>Your saves are automatically grouped into topics and themes. No folders. No manual tagging.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#F3E8FF" }}>📄</div>
          <h3>Build pages</h3>
          <p>Turn your saves into structured documents. Add notes, link items, and think on the page.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#FEF3C7" }}>🔖</div>
          <h3>Read Later queue</h3>
          <p>A clean, distraction-free reading list. See estimated reading times and mark items done.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#FFE4E6" }}>✦</div>
          <h3>Visual boards</h3>
          <p>Arrange your saves on a spatial canvas. Think visually, connect ideas, spot patterns.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#ECFDF5" }}>🔗</div>
          <h3>Share anything</h3>
          <p>Share individual saves or entire pages with a single link. Public or private — your choice.</p>
        </div>
      </div>

      {/* Extension CTA */}
      <div className="ext-cta">
        <h2>Save from anywhere, instantly.</h2>
        <p>Install the Clutch browser extension and clip any page in one click. Works with Chrome.</p>
        <a
          href="/clutch-extension.zip"
          className="btn btn-primary btn-lg"
          download
        >
          ↓ Download Extension (.zip)
        </a>
        <p style={{ fontSize: "0.78rem", opacity: 0.5 }}>
          Chrome → Extensions → Developer mode → Load unpacked (after extracting zip)
        </p>
      </div>

      {/* Footer */}
      <footer style={{ padding: "2rem", textAlign: "center", color: "var(--text-3)", fontSize: "0.82rem", borderTop: "1px solid var(--border)" }}>
        © 2026 Clutch · Built for people who care about what they read.
      </footer>
    </div>
  );
}

// ─── Auth Panel ──────────────────────────────────────────
function AuthPanel({
  mode,
  onSwitch,
  onBack,
  onSuccess,
}: {
  mode: "signin" | "signup";
  onSwitch: () => void;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = mode === "signup"
      ? await signUp(name.trim(), email.trim(), password)
      : await signIn(email.trim(), password);

    if (result instanceof Error) {
      setError(result.message);
      setLoading(false);
    } else {
      // Cache user for sync getUser() calls
      localStorage.setItem("clutch_sb_user", JSON.stringify(result));
      onSuccess();
    }
  };

  return (
    <div className="auth-panel">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Clutch" style={{ height: 52, width: "auto" }} />
          <span>Clutch</span>
        </div>
        <h2 className="auth-title">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="auth-sub">
          {mode === "signup"
            ? "Start saving smarter today. Free forever."
            : "Sign in to your Clutch workspace."}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handle}>
          {mode === "signup" && (
            <div>
              <label className="input-label">Your name</label>
              <input
                className="input"
                type="text"
                placeholder="Alex Chen"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              required
              minLength={mode === "signup" ? 8 : 1}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary full-width"
            style={{ marginTop: "0.25rem" }}
            disabled={loading}
          >
            {loading
              ? "Just a moment…"
              : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
          <button type="button" onClick={onSwitch}>
            {mode === "signup" ? "Sign in" : "Sign up free"}
          </button>
        </p>

        <p style={{ marginTop: "0.75rem", textAlign: "center" }}>
          <button
            type="button"
            style={{ fontSize: "0.8rem", color: "var(--text-4)" }}
            onClick={onBack}
          >
            ← Back to home
          </button>
        </p>
      </div>
    </div>
  );
}
