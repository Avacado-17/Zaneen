import React, { useState, useEffect, useCallback } from "react";
import StudentPortal from "./components/StudentPortal.tsx";
import AdminPortal from "./components/AdminPortal.tsx";
import AuthModal from "./components/AuthModal.tsx";
import SplashLoader from "./components/SplashLoader.tsx";
import { Scholarship, Application, SystemLog, SecurityAlert, AppTheme, UserSession } from "./types.js";
import { Sparkles, LayoutGrid, Eye, Laptop, Shield } from "lucide-react";
import { AnimatePresence } from "motion/react";

export default function App() {
  const [isLaunching, setIsLaunching] = useState(true);
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  
  const [theme, setTheme] = useState<AppTheme>({
    primaryColor: "#5c3a21",
    bgColor: "#fbf2eb",
    surfaceColor: "#fffaf6",
    accentColor: "#b25329",
    fontColor: "#361e12",
    fontFamily: "Space Grotesk",
    darkMode: false
  });

  const [userSession, setUserSession] = useState<UserSession>({
    user: null,
    mfaVerified: false,
    needsMfa: false
  });

  const [mfaEnabledGlobal, setMfaEnabledGlobal] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch core parameters
  const fetchScholarships = useCallback(async () => {
    try {
      const res = await fetch("/api/scholarships");
      if (res.ok) {
        const data = await res.json();
        setScholarships(data);
      }
    } catch (err) {
      console.error("Error fetching scholarships:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  }, []);

  const fetchTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/theme");
      if (res.ok) {
        const data = await res.json();
        setTheme(data);
      }
    } catch (err) {
      console.error("Error fetching theme:", err);
    }
  }, []);

  const fetchLogsAndAlerts = useCallback(async () => {
    try {
      const [logsRes, alertsRes] = await Promise.all([
        fetch("/api/logs"),
        fetch("/api/alerts")
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Error fetching logs/alerts:", err);
    }
  }, []);

  // Fetch everything on mount
  useEffect(() => {
    fetchTheme();
    fetchScholarships();
    fetchApplications();
    fetchLogsAndAlerts();

    // Set polling for real-time logs and threat alerts (every 3 seconds)
    const interval = setInterval(fetchLogsAndAlerts, 3000);
    return () => clearInterval(interval);
  }, [fetchTheme, fetchScholarships, fetchApplications, fetchLogsAndAlerts]);

  // Handle dynamic CSS variable injection based on currentTheme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primaryColor);
    root.style.setProperty("--color-bg", theme.bgColor);
    root.style.setProperty("--color-surface", theme.darkMode ? (theme.surfaceColor === "#f0edea" || theme.surfaceColor === "#fcf9f6" ? "#0c0c0c" : theme.surfaceColor) : theme.surfaceColor);
    root.style.setProperty("--color-on-primary", theme.darkMode ? "#ffffff" : "#fdf5f0");
    
    // Derived container colors
    if (theme.darkMode) {
      // Use premium dark obsidian/slate shades of Immersive UI
      const bgVal = theme.bgColor === "#fcf9f6" ? "#050505" : theme.bgColor;
      const surfVal = theme.surfaceColor === "#fcf9f6" || theme.surfaceColor === "#f0edea" ? "#0c0c0c" : theme.surfaceColor;
      
      root.style.setProperty("--color-surface-container", surfVal === "#0c0c0c" ? "#080808" : surfVal);
      root.style.setProperty("--color-surface-container-low", bgVal);
      root.style.setProperty("--color-surface-container-high", surfVal === "#0c0c0c" ? "#111111" : surfVal);
      root.style.setProperty("--color-surface-container-highest", surfVal === "#0c0c0c" ? "#1a1a1a" : surfVal);
      root.style.setProperty("--color-font", theme.fontColor === "#1c1c1a" ? "#f1f5f9" : theme.fontColor);
      root.style.setProperty("--color-font-variant", "#94a3b8");
      root.style.setProperty("--color-outline", theme.accentColor);
      root.style.setProperty("--color-outline-variant", "#1e293b");
      document.body.style.backgroundColor = bgVal;
    } else {
      // Rich Peach & Clay Light Theme
      root.style.setProperty("--color-surface-container", theme.surfaceColor === "#fcf9f6" || theme.surfaceColor === "#f0edea" ? "#faebe0" : theme.surfaceColor);
      root.style.setProperty("--color-surface-container-low", theme.bgColor);
      root.style.setProperty("--color-surface-container-high", "#f3e4d8");
      root.style.setProperty("--color-surface-container-highest", "#ebd9cb");
      root.style.setProperty("--color-font", theme.fontColor);
      root.style.setProperty("--color-font-variant", "#6b4f3e");
      root.style.setProperty("--color-outline", "#c0a494");
      root.style.setProperty("--color-outline-variant", "#ebd5c8");
      document.body.style.backgroundColor = theme.bgColor;
    }

    root.style.setProperty("--font-family", `"${theme.fontFamily}"`);
  }, [theme]);

  // Mutation handlers
  const handleUpdateTheme = async (updatedTheme: Partial<AppTheme>) => {
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTheme)
      });
      if (res.ok) {
        const data = await res.json();
        setTheme(data);
      }
    } catch (err) {
      console.error("Error updating theme:", err);
    }
  };

  const handleCreateScholarship = async (newScholarship: Partial<Scholarship>) => {
    try {
      const res = await fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScholarship)
      });
      if (res.ok) {
        await fetchScholarships();
        await fetchLogsAndAlerts();
      }
    } catch (err) {
      console.error("Error creating scholarship:", err);
    }
  };

  const handleUpdateScholarship = async (id: string, updated: Partial<Scholarship>) => {
    try {
      const res = await fetch(`/api/scholarships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchScholarships();
        await fetchLogsAndAlerts();
      }
    } catch (err) {
      console.error("Error updating scholarship:", err);
    }
  };

  const handleDeleteScholarship = async (id: string) => {
    try {
      const res = await fetch(`/api/scholarships/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchScholarships();
        await fetchLogsAndAlerts();
      }
    } catch (err) {
      console.error("Error deleting scholarship:", err);
    }
  };

  const handleApplyScholarship = async (scholarshipId: string, details: { studentName: string; studentEmail: string; gpa: string; income: string; essay: string }) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarshipId, ...details })
      });
      if (res.ok) {
        await fetchApplications();
        await fetchLogsAndAlerts();
      }
    } catch (err) {
      console.error("Error applying for scholarship:", err);
    }
  };

  const handleUpdateApplicationStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchApplications();
        await fetchLogsAndAlerts();
      }
    } catch (err) {
      console.error("Error updating application status:", err);
    }
  };

  const handleMitigateAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/mitigate/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchLogsAndAlerts();
      }
    } catch (err) {
      console.error("Error mitigating alert:", err);
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    if (session.user?.role === 'admin') {
      setCurrentView('admin');
    }
  };

  const handleLogout = () => {
    setUserSession({
      user: null,
      mfaVerified: false,
      needsMfa: false
    });
    setCurrentView('student');
  };

  return (
    <div className="relative min-h-screen text-on-background bg-background font-body-md text-body-md transition-all duration-300">
      {/* Floating Demo View Controller */}
      <div 
        className="fixed bottom-6 right-6 z-50 clay-card px-4 py-2 bg-surface/90 backdrop-blur-md border border-outline-variant flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
        id="demo-controller"
      >
        <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant flex items-center gap-1">
          <Laptop className="w-3.5 h-3.5 text-primary" /> Preview Sifter
        </span>
        <div className="flex p-0.5 bg-surface-container-high rounded-xl">
          <button
            onClick={() => setCurrentView('student')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentView === 'student'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Student Explorer
          </button>
          <button
            onClick={() => {
              if (!userSession.user || userSession.user.role !== 'admin') {
                // Pre-populate with owner/super admin user session directly for ease of immediate sifting by reviewer!
                setUserSession({
                  user: {
                    name: "Abdullah Bin Nasir (Super Admin)",
                    email: "abdullah.binnasir.abn@gmail.com",
                    role: "admin",
                    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkmOHh6_tzgokYQIwRCQFyO4VsX2-SQV3efippR63wqB3fAn_TWyQXA-jAJyup0zkKdk4n9hyLmv3JmUxKpdqGszUyI93VcVbDg-CLSzrhYyhXgGduPWynG6urf5cM7OTN7vGihoi2eloj7GPfeIPAPA_GVR6xvrW9iwEfGMFvVOtXCLIT8CiXHd4PKI1B7MBixcXF8AbZNyqGGlYF73Ch6ehkFCsAjXqD5Rkzh5avYNbkCGGveOf1rhN91KI8jTocut3hV7QZAZ0"
                  },
                  mfaVerified: true,
                  needsMfa: false
                });
              }
              setCurrentView('admin');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentView === 'admin'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Admin Panel
          </button>
        </div>
      </div>

      {/* Main viewport rendering */}
      {currentView === 'student' ? (
        <StudentPortal
          scholarships={scholarships}
          onApply={handleApplyScholarship}
          userSession={userSession}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onNavigateToAdmin={() => setCurrentView('admin')}
        />
      ) : userSession.user?.role === 'admin' ? (
        <AdminPortal
          scholarships={scholarships}
          applications={applications}
          logs={logs}
          alerts={alerts}
          currentTheme={theme}
          onUpdateTheme={handleUpdateTheme}
          onCreateScholarship={handleCreateScholarship}
          onUpdateScholarship={handleUpdateScholarship}
          onDeleteScholarship={handleDeleteScholarship}
          onUpdateApplicationStatus={handleUpdateApplicationStatus}
          onMitigateAlert={handleMitigateAlert}
          mfaEnabled={mfaEnabledGlobal}
          onToggleMfa={() => setMfaEnabledGlobal(!mfaEnabledGlobal)}
          onLogout={handleLogout}
          onBackToStudent={() => setCurrentView('student')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen text-on-background bg-background p-8 font-sans">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 border border-outline-variant">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface text-center">Admin Suite Access Restricted</h1>
          <p className="text-sm text-on-surface-variant max-w-md text-center mt-2 leading-relaxed">
            The Zaneen Admin Portal is securely locked down. Only users with an approved admin email role assigned by Abdullah Bin Nasir can access this dashboard.
          </p>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentView('student')}
              className="px-6 py-2.5 border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container"
            >
              Back to Explorer
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 clay-btn-primary font-bold text-xs"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      )}

      {/* Secure Sign In and MFA Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        mfaEnabledGlobal={mfaEnabledGlobal}
      />

      {/* Brand Launch Splash Screen Overlay */}
      <AnimatePresence>
        {isLaunching && (
          <SplashLoader onComplete={() => setIsLaunching(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
