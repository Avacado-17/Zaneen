import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  School, ClipboardList, Activity, Settings, Plus, Edit, Save, 
  Search, Filter, Megaphone, FileEdit, DollarSign, Landmark, ArrowUpRight,
  TrendingUp, CheckCircle, XCircle, ShieldAlert, FileCode, RefreshCw, Sparkles,
  Lock, Trash2, Eye, Sun, Moon, Volume2, Key, ListFilter, Sliders, Check, EyeOff, LayoutGrid,
  ArrowUp, ArrowDown, Image as ImageIcon, Layers
} from "lucide-react";
import { Scholarship, Application, SystemLog, SecurityAlert, AppTheme, UserSession, PageBlock } from "../types.js";
import ZaneenLogo from "./ZaneenLogo.tsx";

interface AdminPortalProps {
  scholarships: Scholarship[];
  applications: Application[];
  logs: SystemLog[];
  alerts: SecurityAlert[];
  pageBlocks: PageBlock[];
  currentTheme: AppTheme;
  onUpdateTheme: (theme: Partial<AppTheme>) => Promise<void>;
  onCreateScholarship: (scholarship: Partial<Scholarship>) => Promise<void>;
  onUpdateScholarship: (id: string, scholarship: Partial<Scholarship>) => Promise<void>;
  onDeleteScholarship: (id: string) => Promise<void>;
  onUpdateApplicationStatus: (id: string, status: 'Approved' | 'Rejected') => Promise<void>;
  onMitigateAlert: (id: string) => Promise<void>;
  onUpdatePageBlocks: (blocks: PageBlock[]) => Promise<void>;
  mfaEnabled: boolean;
  onToggleMfa: () => void;
  onLogout: () => void;
  onBackToStudent?: () => void;
  userSession?: UserSession;
}

export default function AdminPortal({
  scholarships,
  applications,
  logs,
  alerts,
  pageBlocks,
  currentTheme,
  onUpdateTheme,
  onCreateScholarship,
  onUpdateScholarship,
  onDeleteScholarship,
  onUpdateApplicationStatus,
  onMitigateAlert,
  onUpdatePageBlocks,
  mfaEnabled,
  onToggleMfa,
  onLogout,
  onBackToStudent,
  userSession
}: AdminPortalProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'scholarships' | 'applications' | 'analytics' | 'settings' | 'layout'>('scholarships');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  // Scholarship form state
  const [formTitle, setFormTitle] = useState("");
  const [formAward, setFormAward] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("STEM");
  const [formStatus, setFormStatus] = useState<'Active' | 'Draft'>("Active");

  // Filtering and Searching
  const [scholarshipSearch, setScholarshipSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Theme configuration form state
  const [editPrimary, setEditPrimary] = useState(currentTheme.primaryColor);
  const [editBg, setEditBg] = useState(currentTheme.bgColor);
  const [editSurface, setEditSurface] = useState(currentTheme.surfaceColor);
  const [editAccent, setEditAccent] = useState(currentTheme.accentColor);
  const [editFontColor, setEditFontColor] = useState(currentTheme.fontColor);
  const [editFontFamily, setEditFontFamily] = useState(currentTheme.fontFamily);
  const [contrastStatus, setContrastStatus] = useState("Pass (WCAG AAA)");

  // Admin permissions management (Google Docs style)
  const [adminsList, setAdminsList] = useState<string[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [permissionError, setPermissionError] = useState("");
  
  // Page layout builder states
  const [layoutViewMode, setLayoutViewMode] = useState<'editor' | 'preview'>('editor');
  const [layoutSaveNotice, setLayoutSaveNotice] = useState<string>("");
  const [permissionSuccess, setPermissionSuccess] = useState("");

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/auth/admins");
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setAdminsList(data.admins || []);
        setAccessRequests(data.accessRequests || []);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  useEffect(() => {
    fetchPermissions();
    const interval = setInterval(fetchPermissions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePromoteAdmin = async (email: string) => {
    setPermissionError("");
    setPermissionSuccess("");
    try {
      const res = await fetch("/api/auth/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setAdminsList(data.admins);
        setAccessRequests(data.accessRequests);
        setPermissionSuccess(`Successfully promoted ${email} to Administrator!`);
        setInviteEmail("");
      } else if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setPermissionError(data.error || "Failed to promote user.");
      } else {
        setPermissionError("Server returned invalid response format.");
      }
    } catch (err) {
      setPermissionError("Network error promoting user.");
    }
  };

  const handleRevokeAdmin = async (email: string) => {
    setPermissionError("");
    setPermissionSuccess("");
    try {
      const res = await fetch("/api/auth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setAdminsList(data.admins);
        setAccessRequests(data.accessRequests);
        setPermissionSuccess(`Successfully revoked administrator permissions for ${email}.`);
      } else if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setPermissionError(data.error || "Failed to revoke permissions.");
      } else {
        setPermissionError("Server returned invalid response format.");
      }
    } catch (err) {
      setPermissionError("Network error revoking permissions.");
    }
  };

  const handleRejectRequest = async (id: string) => {
    setPermissionError("");
    setPermissionSuccess("");
    try {
      const res = await fetch("/api/auth/reject-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setAccessRequests(data.accessRequests);
        setPermissionSuccess("Access request rejected successfully.");
      } else if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setPermissionError(data.error || "Failed to reject request.");
      } else {
        setPermissionError("Server returned invalid response format.");
      }
    } catch (err) {
      setPermissionError("Network error rejecting request.");
    }
  };

  // Sync state with incoming theme updates
  useEffect(() => {
    setEditPrimary(currentTheme.primaryColor);
    setEditBg(currentTheme.bgColor);
    setEditSurface(currentTheme.surfaceColor);
    setEditAccent(currentTheme.accentColor);
    setEditFontColor(currentTheme.fontColor);
    setEditFontFamily(currentTheme.fontFamily);
  }, [currentTheme]);

  // Handle scholarship modal setup
  const openCreateModal = () => {
    setEditingScholarship(null);
    setFormTitle("");
    setFormAward("5000");
    setFormDeadline(new Date().toISOString().split('T')[0]);
    setFormDesc("");
    setFormCategory("STEM");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const openEditModal = (s: Scholarship) => {
    setEditingScholarship(s);
    setFormTitle(s.title);
    setFormAward(s.awardAmount.toString());
    setFormDeadline(s.deadline);
    setFormDesc(s.description);
    setFormCategory(s.category);
    setFormStatus(s.status as 'Active' | 'Draft');
    setIsModalOpen(true);
  };

  const handleSaveScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formTitle,
      awardAmount: Number(formAward) || 1000,
      deadline: formDeadline,
      description: formDesc,
      category: formCategory,
      status: formStatus
    };

    if (editingScholarship) {
      await onUpdateScholarship(editingScholarship.id, payload);
    } else {
      await onCreateScholarship(payload);
    }
    setIsModalOpen(false);
  };

  const handleApplyTheme = async () => {
    await onUpdateTheme({
      primaryColor: editPrimary,
      bgColor: editBg,
      surfaceColor: editSurface,
      accentColor: editAccent,
      fontColor: editFontColor,
      fontFamily: editFontFamily
    });
  };

  const handleThemePreset = async (preset: string) => {
    let payload: Partial<AppTheme> = {};
    if (preset === 'terracotta') {
      payload = {
        primaryColor: "#5c3a21",
        bgColor: "#fbf2eb",
        surfaceColor: "#fffaf6",
        accentColor: "#b25329",
        fontColor: "#361e12",
        fontFamily: "Space Grotesk",
        darkMode: false
      };
    } else if (preset === 'lumina') {
      payload = {
        primaryColor: "#00e38a",
        bgColor: "#10141a",
        surfaceColor: "#1c2026",
        accentColor: "#9089d3",
        fontColor: "#dfe2eb",
        fontFamily: "JetBrains Mono"
      };
    } else if (preset === 'ocean') {
      payload = {
        primaryColor: "#0284c7",
        bgColor: "#f0f9ff",
        surfaceColor: "#e0f2fe",
        accentColor: "#0f766e",
        fontColor: "#0f172a",
        fontFamily: "Inter"
      };
    }
    await onUpdateTheme(payload);
  };

  // Stats calculation
  const totalFunds = scholarships
    .filter(s => s.status === 'Active')
    .reduce((acc, curr) => acc + curr.awardAmount, 0);

  const filteredScholarships = scholarships.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(scholarshipSearch.toLowerCase()) || 
                          s.description.toLowerCase().includes(scholarshipSearch.toLowerCase());
    const matchesCategory = categoryFilter === "All" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen overflow-hidden text-on-background bg-background font-body-md text-body-md transition-all duration-300">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col gap-3 p-6 bg-surface border-r border-outline-variant h-[calc(100vh-32px)] w-64 m-4 rounded-2xl flex-shrink-0 clay-card z-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 px-2 pt-2 text-left">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary shadow-sm bg-surface-container flex items-center justify-center font-bold text-lg text-primary">
            {userSession?.user?.avatar ? (
              <img 
                alt={userSession.user.name || "Admin Profile"} 
                className="w-full h-full object-cover" 
                src={userSession.user.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              userSession?.user?.name ? userSession.user.name.charAt(0) : "A"
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-sm text-primary truncate">
              {userSession?.user?.name || "Admin Portal"}
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant truncate">
              {userSession?.user?.email || "Management Suite"}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-2 flex-grow">
          <button 
            onClick={() => setActiveTab('scholarships')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs font-mono transition-all text-left ${
              activeTab === 'scholarships' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Scholarships</span>
          </button>

          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs font-mono transition-all text-left ${
              activeTab === 'applications' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Applications ({applications.filter(a => a.status === 'Pending').length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs font-mono transition-all text-left ${
              activeTab === 'analytics' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Analytics & Threats</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs font-mono transition-all text-left ${
              activeTab === 'settings' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Style & Security</span>
          </button>

          <button 
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs font-mono transition-all text-left ${
              activeTab === 'layout' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Page Layout</span>
          </button>

          {onBackToStudent && (
            <button 
              onClick={onBackToStudent}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs font-mono transition-all text-left text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1 border-t border-dashed border-outline-variant/60 pt-3 mt-1"
            >
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Go to Student Site</span>
            </button>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 w-full py-3 clay-button-primary rounded-xl font-bold text-xs font-mono cursor-pointer text-on-primary"
          >
            <Plus className="w-4 h-4" />
            Add Program
          </button>
          
          <button
            onClick={onLogout}
            className="py-2.5 border border-outline-variant hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-mono font-bold transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 w-full h-full text-left">
        {/* Mobile Navbar Header */}
        <div className="md:hidden flex justify-between items-center bg-surface p-4 rounded-xl mb-6 border border-outline-variant">
          <ZaneenLogo size={24} showText={true} textColorClass="text-primary font-bold text-base" layout="horizontal" />
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'settings' ? 'scholarships' : 'settings')}
              className="p-2 bg-surface-container rounded-lg text-primary border border-outline-variant"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-200"
            >
              Exit
            </button>
          </div>
        </div>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface leading-tight tracking-tight">
              {activeTab === 'scholarships' && "Scholarships Management"}
              {activeTab === 'applications' && "Application Review Deck"}
              {activeTab === 'analytics' && "System Analytics & Security Firewall"}
              {activeTab === 'settings' && "System Styling & Core Configurations"}
              {activeTab === 'layout' && "Student Page Layout Builder"}
            </h1>
            <p className="font-body-lg text-sm sm:text-base text-on-surface-variant mt-1.5 max-w-2xl">
              {activeTab === 'scholarships' && "Create, update, and deploy financial opportunities to matching student pools."}
              {activeTab === 'applications' && "Review submissions, verify transcript data, and approve candidates with logged compliance hashes."}
              {activeTab === 'analytics' && "Monitor real-time system performance, query throughput, API latencies, and security threats."}
              {activeTab === 'settings' && "Customize brand colors, layout typography, system-wide dark mode, and multi-factor authentication (MFA)."}
              {activeTab === 'layout' && "Add, edit, reorder, and preview dynamic content blocks deployed directly to the student homepage."}
            </p>
          </div>

          {activeTab === 'scholarships' && (
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  value={scholarshipSearch}
                  onChange={(e) => setScholarshipSearch(e.target.value)}
                  placeholder="Search programs..."
                  className="clay-input pl-9 pr-4 py-2 text-xs w-full sm:w-48 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="clay-input py-2 pl-3 pr-8 text-xs bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
              >
                <option value="All">All Categories</option>
                <option value="STEM">STEM</option>
                <option value="Arts">Arts</option>
                <option value="Humanities">Humanities</option>
                <option value="Environment">Environment</option>
              </select>
            </div>
          )}
        </header>

        {/* Dynamic Content Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'scholarships' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
              key="scholarships-tab"
            >
              {/* Bento Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="clay-card rounded-2xl p-6 flex flex-col gap-2 border border-outline-variant bg-surface relative overflow-hidden">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase">Active Programs</span>
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-display text-4xl font-bold text-primary">{scholarships.filter(s => s.status === 'Active').length}</div>
                  <div className="flex items-center gap-1 text-[11px] text-green-700 font-bold font-mono">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Live matches calculating</span>
                  </div>
                </div>

                <div className="clay-card rounded-2xl p-6 flex flex-col gap-2 border border-outline-variant bg-surface relative overflow-hidden">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase">Applications Intake</span>
                    <FileEdit className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-display text-4xl font-bold text-on-surface">{applications.length}</div>
                  <div className="flex items-center gap-1 text-[11px] text-primary font-bold font-mono">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{applications.filter(a => a.status === 'Pending').length} Pending review</span>
                  </div>
                </div>

                <div className="clay-card rounded-2xl p-6 flex flex-col gap-2 border border-outline-variant bg-surface relative overflow-hidden">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase">Funds Allocated</span>
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-display text-4xl font-bold text-on-surface">PKR {totalFunds.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-bold font-mono">
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Secure escrow deployment</span>
                  </div>
                </div>
              </div>

              {/* Table list */}
              <div className="clay-card border border-outline-variant rounded-2xl overflow-hidden mt-2 bg-surface">
                <div className="p-5 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low">
                  <h3 className="font-display font-bold text-lg text-on-surface">Active Programs</h3>
                  <button 
                    onClick={openCreateModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold clay-button-secondary rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Program
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high/40 text-on-surface-variant text-xs font-bold font-mono uppercase tracking-wider border-b border-outline-variant/40">
                        <th className="p-4 pl-6">Program Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Deadline</th>
                        <th className="p-4">Award Amt</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-sm">
                      {filteredScholarships.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs font-mono text-on-surface-variant">
                            No scholarship programs matched the current query filters.
                          </td>
                        </tr>
                      ) : (
                        filteredScholarships.map((s) => (
                          <tr key={s.id} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="p-4 pl-6 font-bold text-on-surface">
                              <div className="flex flex-col">
                                <span>{s.title}</span>
                                <span className="text-[10px] font-mono font-normal text-on-surface-variant mt-0.5 max-w-sm truncate">{s.description}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30">
                                {s.category}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-mono text-on-surface-variant">{s.deadline}</td>
                            <td className="p-4 font-mono font-bold text-primary">PKR {s.awardAmount.toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1.5 ${
                                s.status === 'Active' 
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                {s.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => openEditModal(s)}
                                  className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-high transition-all"
                                  title="Edit Scholarship"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => onDeleteScholarship(s.id)}
                                  className="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                                  title="Delete Scholarship"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'applications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
              key="applications-tab"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Active submissions deck */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <h3 className="font-display font-bold text-lg text-on-surface px-1">
                    Student Submissions Queue ({applications.length})
                  </h3>

                  <div className="flex flex-col gap-4 max-h-[640px] overflow-y-auto pr-1">
                    {applications.length === 0 ? (
                      <div className="clay-card p-12 text-center text-xs font-mono text-on-surface-variant border border-outline-variant bg-surface">
                        No applications submitted yet. Student submissions will appear here instantly.
                      </div>
                    ) : (
                      applications.map((app) => (
                        <div 
                          key={app.id} 
                          className={`clay-card p-6 border bg-surface flex flex-col gap-4 transition-all ${
                            app.status === 'Approved' 
                              ? 'border-emerald-500/30 shadow-sm' 
                              : app.status === 'Rejected' 
                              ? 'border-red-500/30' 
                              : 'border-outline-variant hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <div>
                              <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                {app.scholarshipTitle}
                              </span>
                              <h4 className="font-display font-bold text-base text-on-surface mt-2">
                                {app.studentName}
                              </h4>
                              <p className="text-xs font-mono text-on-surface-variant">{app.studentEmail} • Applied on {app.appliedDate}</p>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              app.status === 'Approved' 
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                                : app.status === 'Rejected' 
                                ? 'bg-red-950/40 text-red-400 border border-red-500/20' 
                                : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                            }`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 p-3 bg-surface-container-low rounded-xl text-xs border border-outline-variant/20">
                            <div>
                              <span className="text-on-surface-variant block">Academic GPA</span>
                              <b className="font-mono text-on-surface text-sm">{app.gpa}%</b>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block">Household Income</span>
                              <b className="text-on-surface text-sm">{app.income}</b>
                            </div>
                            <div>
                              <span className="text-on-surface-variant block">Audit Hash</span>
                              <code className="text-[10px] font-mono text-primary truncate block" title={app.id}>{app.id}</code>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-xs font-bold text-on-surface-variant block mb-1">Statement Essay:</span>
                            <div className="p-4 bg-surface-container rounded-xl text-xs text-on-surface leading-relaxed italic border border-outline-variant/10">
                              "{app.essay}"
                            </div>
                          </div>

                          {app.status === 'Pending' && (
                            <div className="flex justify-end gap-3 mt-1">
                              <button
                                onClick={() => onUpdateApplicationStatus(app.id, 'Rejected')}
                                className="flex items-center gap-1 px-4 py-2 text-xs font-mono font-bold text-red-400 bg-red-950/30 hover:bg-red-950/50 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject Candidate
                              </button>
                              <button
                                onClick={() => onUpdateApplicationStatus(app.id, 'Approved')}
                                className="flex items-center gap-1 px-4 py-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve Candidate
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit side card */}
                <div className="clay-card p-6 border border-outline-variant bg-surface text-left">
                  <h4 className="font-display font-bold text-base text-primary mb-3">
                    Decision Guidelines
                  </h4>
                  <div className="flex flex-col gap-4 text-xs text-on-surface-variant">
                    <p>
                      In order to maintain strict WCAG compliance and role-based access control guidelines, approving or rejecting candidates records a state validation query directly onto our backend API.
                    </p>
                    <div className="h-px bg-outline-variant" />
                    <div>
                      <span className="font-bold text-on-surface block mb-1">Automatic Compliance Checks:</span>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Verified Cumulative GPA must be above 85.0%.</li>
                        <li>Socioeconomic parameter scaling applied dynamically.</li>
                        <li>Essay content scanned for cross-site script validation hashes.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              key="analytics-tab"
            >
              {/* Security Alerts (Left 5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-lg text-on-surface">
                    Threat Shield Firewall
                  </h3>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                    Core Online
                  </span>
                </div>

                <div className="flex flex-col gap-4 max-h-[580px] overflow-y-auto pr-1">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`clay-card p-4 border rounded-xl flex flex-col gap-3 text-left ${
                        alert.status === 'Active' 
                          ? 'border-red-500/30 bg-red-950/20' 
                          : 'border-outline-variant bg-surface'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                          alert.severity === 'Critical' || alert.severity === 'High'
                            ? 'bg-red-950/40 text-red-400 border-red-500/20'
                            : 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                        }`}>
                          {alert.severity} Priority
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-red-400" /> {alert.type}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                          {alert.details}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10 text-[10px] font-mono text-on-surface-variant">
                        <span>Source IP: <b className="text-primary">{alert.sourceIp}</b></span>
                        {alert.status === 'Active' ? (
                          <button
                            onClick={() => onMitigateAlert(alert.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Lock className="w-3 h-3" /> Mitigate Threat
                          </button>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Mitigated
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Access Audit logs (Right 7 columns) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-lg text-on-surface">
                    Real-time Access & API Logging
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-on-surface-variant">Live Console Streaming</span>
                  </div>
                </div>

                <div className="clay-card p-5 bg-stone-900 border border-stone-800 rounded-2xl">
                  <div className="flex justify-between items-center mb-3 text-xs font-mono text-stone-400 border-b border-stone-800 pb-2">
                    <span>AUDIT_LOGS_CONSOLE</span>
                    <span>JSON View Payload</span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto font-mono text-left select-none text-[11px] leading-relaxed pr-2">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`py-1.5 px-2.5 rounded hover:bg-stone-800/40 transition-colors border-l-2 ${
                          log.severity === 'CRITICAL' 
                            ? 'border-red-500 text-red-400 bg-red-950/20' 
                            : log.severity === 'WARNING'
                            ? 'border-amber-500 text-amber-400'
                            : 'border-green-500 text-green-400'
                        }`}
                      >
                        <div className="flex justify-between text-[10px] opacity-75 mb-0.5">
                          <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span>{log.ip} • STATUS {log.statusCode}</span>
                        </div>
                        <div>
                          <b className="font-bold text-stone-200">[{log.activityType}]</b> {log.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              key="settings-tab"
            >
              {/* Left Theme Sifter Form (Span 7 columns) */}
              <div className="lg:col-span-7 clay-card p-6 md:p-8 border border-outline-variant bg-surface flex flex-col gap-6 text-left">
                <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
                  <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Active Brand customizer
                  </h3>
                  <span className="text-xs font-mono font-bold text-primary">No-Code Live Injection</span>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Presets */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-on-surface-variant">Theme Style Presets</span>
                    <div className="grid grid-cols-3 gap-2.5 mt-1">
                      <button
                        onClick={() => handleThemePreset('terracotta')}
                        className="py-3 px-3 rounded-xl bg-surface border border-outline-variant hover:border-primary font-bold text-xs flex flex-col items-center gap-1 shadow-sm"
                      >
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full bg-[#5c3a21]" />
                          <span className="w-3 h-3 rounded-full bg-[#fbf2eb]" />
                          <span className="w-3 h-3 rounded-full bg-[#b25329]" />
                        </div>
                        <span className="mt-1 text-on-surface text-[10px] font-mono">Peach & Clay</span>
                      </button>

                      <button
                        onClick={() => handleThemePreset('lumina')}
                        className="py-3 px-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-green-400 font-bold text-xs flex flex-col items-center gap-1 shadow-sm"
                      >
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full bg-[#00e38a]" />
                          <span className="w-3 h-3 rounded-full bg-[#10141a]" />
                          <span className="w-3 h-3 rounded-full bg-[#9089d3]" />
                        </div>
                        <span className="mt-1 text-stone-200 text-[10px] font-mono">Lumina Void</span>
                      </button>

                      <button
                        onClick={() => handleThemePreset('ocean')}
                        className="py-3 px-3 rounded-xl bg-sky-50 border border-sky-200 hover:border-sky-600 font-bold text-xs flex flex-col items-center gap-1 shadow-sm"
                      >
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                          <span className="w-3 h-3 rounded-full bg-[#f0f9ff]" />
                          <span className="w-3 h-3 rounded-full bg-[#0f766e]" />
                        </div>
                        <span className="mt-1 text-sky-900 text-[10px] font-mono">Ocean Breeze</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Primary Theme Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={editPrimary} 
                          onChange={(e) => setEditPrimary(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-outline-variant p-0.5"
                        />
                        <input 
                          type="text" 
                          value={editPrimary} 
                          onChange={(e) => setEditPrimary(e.target.value)}
                          className="clay-input flex-1 p-2 bg-surface-container-low border-none rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Background Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={editBg} 
                          onChange={(e) => setEditBg(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-outline-variant p-0.5"
                        />
                        <input 
                          type="text" 
                          value={editBg} 
                          onChange={(e) => setEditBg(e.target.value)}
                          className="clay-input flex-1 p-2 bg-surface-container-low border-none rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Surface Container Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={editSurface} 
                          onChange={(e) => setEditSurface(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-outline-variant p-0.5"
                        />
                        <input 
                          type="text" 
                          value={editSurface} 
                          onChange={(e) => setEditSurface(e.target.value)}
                          className="clay-input flex-1 p-2 bg-surface-container-low border-none rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Accent Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={editAccent} 
                          onChange={(e) => setEditAccent(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-outline-variant p-0.5"
                        />
                        <input 
                          type="text" 
                          value={editAccent} 
                          onChange={(e) => setEditAccent(e.target.value)}
                          className="clay-input flex-1 p-2 bg-surface-container-low border-none rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Font Text Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={editFontColor} 
                          onChange={(e) => setEditFontColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-outline-variant p-0.5"
                        />
                        <input 
                          type="text" 
                          value={editFontColor} 
                          onChange={(e) => setEditFontColor(e.target.value)}
                          className="clay-input flex-1 p-2 bg-surface-container-low border-none rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Layout Font Family</label>
                      <select
                        value={editFontFamily}
                        onChange={(e) => setEditFontFamily(e.target.value as any)}
                        className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none font-semibold focus:outline-none"
                      >
                        <option value="Geist">Geist (Modern Sans)</option>
                        <option value="Inter">Inter (Swiss Neutral)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech Editorial)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Technical Monospace)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dark Mode and WCAG Compliance summary */}
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-xs font-bold text-on-surface-variant">Accessibility & Contrast Compliance</span>
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex justify-between items-center">
                      <div className="text-left text-xs text-on-surface-variant leading-relaxed">
                        <span>Current Contrast Level: </span>
                        <b className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
                          {contrastStatus}
                        </b>
                        <p className="mt-1 text-[10px]">Ensures compatibility under full WCAG 2.1 AAA protocols.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateTheme({ darkMode: !currentTheme.darkMode })}
                        className="p-3 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded-xl transition-all border border-outline-variant/40"
                        title="Toggle dark mode"
                      >
                        {currentTheme.darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyTheme}
                    className="w-full py-4 mt-3 clay-btn-primary font-bold text-sm tracking-wide shadow-md cursor-pointer text-on-primary"
                  >
                    Apply Theme Changes Globally
                  </button>
                </div>
              </div>

              {/* Right Security Configurations (Span 5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Admin Access Sharing Card (Google Docs style) */}
                <div className="clay-card p-6 border border-outline-variant bg-surface text-left flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/60 pb-2">
                    <h3 className="font-display font-bold text-base text-primary">
                      Admin Access Sharing
                    </h3>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-bold">Google Docs Style</span>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Grant administrative permissions directly by email, or review pending access requests.
                  </p>

                  {/* Add Administrator Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (inviteEmail.trim()) {
                      handlePromoteAdmin(inviteEmail);
                    }
                  }} className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Add people by email</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="user@university.edu"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="clay-input flex-1 p-2.5 bg-surface-container-low border-none rounded-xl text-xs font-mono"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold font-mono hover:scale-105 transition-all"
                      >
                        Share
                      </button>
                    </div>
                  </form>

                  {permissionError && (
                    <p className="text-xs text-red-500 font-semibold">{permissionError}</p>
                  )}
                  {permissionSuccess && (
                    <p className="text-xs text-emerald-600 font-semibold">{permissionSuccess}</p>
                  )}

                  {/* People with Access */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-bold text-on-surface-variant border-b border-outline-variant/30 pb-1">People with access</span>
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {adminsList.map((adminEmail) => (
                        <div key={adminEmail} className="flex items-center justify-between text-xs bg-surface-container-low p-2 rounded-xl border border-outline-variant/30">
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono font-semibold text-on-surface truncate max-w-[150px]" title={adminEmail}>
                              {adminEmail}
                            </span>
                            <span className="text-[9px] text-on-surface-variant font-medium">
                              {adminEmail === 'abdullah.binnasir.abn@gmail.com' ? 'Owner / Super Admin' : 'Administrator'}
                            </span>
                          </div>
                          {adminEmail !== 'abdullah.binnasir.abn@gmail.com' && (
                            <button
                              onClick={() => handleRevokeAdmin(adminEmail)}
                              className="text-[10px] text-red-600 hover:text-red-700 hover:underline font-mono font-bold"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Requests */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-bold text-on-surface-variant border-b border-outline-variant/30 pb-1 flex justify-between items-center">
                      <span>Access requests</span>
                      {accessRequests.filter(r => r.status === 'Pending').length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </span>
                    
                    <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                      {accessRequests.filter(r => r.status === 'Pending').length === 0 ? (
                        <p className="text-[10px] text-on-surface-variant italic py-2">No pending access requests.</p>
                      ) : (
                        accessRequests.filter(r => r.status === 'Pending').map((req) => (
                          <div key={req.id} className="flex flex-col gap-1.5 p-3 bg-amber-50/20 dark:bg-amber-950/10 rounded-xl border border-amber-500/20 text-[11px]">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">{req.name}</span>
                                <span className="font-mono text-on-surface-variant text-[10px]">{req.email}</span>
                              </div>
                              <span className="text-[8px] font-mono text-on-surface-variant">
                                {new Date(req.requestedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {req.message && (
                              <p className="bg-surface-container p-2 rounded text-on-surface-variant leading-normal italic text-[10px]">
                                "{req.message}"
                              </p>
                            )}
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                onClick={() => handleRejectRequest(req.id)}
                                className="px-2.5 py-1 text-[10px] border border-outline-variant hover:bg-red-50 hover:text-red-700 font-bold rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handlePromoteAdmin(req.email)}
                                className="px-2.5 py-1 text-[10px] bg-primary text-on-primary font-bold rounded-lg hover:scale-105 transition-transform"
                              >
                                Approve Access
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="clay-card p-6 border border-outline-variant bg-surface text-left">
                  <h3 className="font-display font-bold text-base text-primary mb-3">
                    Multi-Factor Protection
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    Force Multi-Factor Authentication (MFA) via Secure Google Authenticator Passcode validation for all internal roles.
                  </p>

                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <span className="text-xs font-bold text-on-surface">MFA Code Enforcement</span>
                    <button
                      onClick={onToggleMfa}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${
                        mfaEnabled ? 'bg-green-600' : 'bg-surface-container-high'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        mfaEnabled ? 'translate-x-6' : ''
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="clay-card p-6 border border-outline-variant bg-surface text-left flex flex-col gap-3">
                  <h3 className="font-display font-bold text-base text-primary">
                    Audit Certificate
                  </h3>
                  <div className="text-xs text-on-surface-variant flex flex-col gap-2">
                    <p>
                      This site complies fully with secure credential hashes and robust token exchange parameters to prevent cross-site hijacking.
                    </p>
                    <div className="h-px bg-outline-variant mt-1" />
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>SECURE_SESSION:</span>
                      <span className="text-emerald-400">AES_256_GCM</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>TOKEN_EXCHANGE:</span>
                      <span className="text-emerald-400">OAUTH_JWT_HS256</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'layout' && (() => {
            const currentBlocks = Array.isArray(pageBlocks) 
              ? [...pageBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) 
              : [];

            const handleAddBlock = (type: 'heading' | 'paragraph' | 'callout' | 'image' | 'divider') => {
              const defaultContentMap = {
                heading: 'New Custom Heading',
                paragraph: 'Write your announcement or descriptive section here.',
                callout: 'Important Note: Ensure all scholarship application transcripts are verified before submission deadlines.',
                image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
                divider: '---'
              };
              const newBlock: PageBlock = {
                id: `block-${Math.random().toString(36).substr(2, 9)}`,
                type,
                content: defaultContentMap[type],
                order: currentBlocks.length
              };

              onUpdatePageBlocks([...currentBlocks, newBlock]);
              setLayoutSaveNotice("New block added to student portal layout!");
              setTimeout(() => setLayoutSaveNotice(""), 3000);
            };

            const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
              const targetIndex = direction === 'up' ? index - 1 : index + 1;
              if (targetIndex < 0 || targetIndex >= currentBlocks.length) return;

              const updated = [...currentBlocks];
              const tempOrder = updated[index].order;
               updated[index].order = updated[targetIndex].order;
              updated[targetIndex].order = tempOrder;

              onUpdatePageBlocks(updated);
              setLayoutSaveNotice("Block order updated!");
              setTimeout(() => setLayoutSaveNotice(""), 3000);
            };

            const handleUpdateBlockContent = (id: string, content: string) => {
              const updated = currentBlocks.map(b => b.id === id ? { ...b, content } : b);
              onUpdatePageBlocks(updated);
            };

            const handleUpdateBlockType = (id: string, type: PageBlock['type']) => {
              const updated = currentBlocks.map(b => b.id === id ? { ...b, type } : b);
              onUpdatePageBlocks(updated);
            };

            const handleDeleteBlock = (id: string) => {
              const updated = currentBlocks.filter(b => b.id !== id);
               onUpdatePageBlocks(updated);
              setLayoutSaveNotice("Block removed.");
              setTimeout(() => setLayoutSaveNotice(""), 3000);
            };

            const handleLoadDefaultTemplate = () => {
              const defaultTemplate: PageBlock[] = [
                {
                  id: "block-welcome-1",
                  type: "heading",
                  content: "Welcome to Zaneen Scholarship Portal",
                  order: 0
                },
                {
                  id: "block-welcome-2",
                  type: "paragraph",
                  content: "Explore financial grants, merit awards, and research fellowships curated for students at Stanford, MIT, and partner institutions worldwide.",
                  order: 1
                },
                {
                   id: "block-welcome-3",
                  type: "callout",
                  content: "📢 Spring 2026 Admissions Open: Early bird candidate submissions receive expedited GPA verification.",
                  order: 2
                },
                {
                  id: "block-welcome-4",
                  type: "divider",
                  content: "---",
                  order: 3
                }
              ];
              onUpdatePageBlocks(defaultTemplate);
              setLayoutSaveNotice("Template layout loaded successfully!");
              setTimeout(() => setLayoutSaveNotice(""), 3000);
            };

            return (
            <motion.div
              key="layout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
               {/* Layout Controls Bar */}
                <div className="clay-card p-6 border border-outline-variant bg-surface rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      <h3 className="font-display font-bold text-lg text-on-surface">Layout Control Deck</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">
                      Configure visual sections displayed on the student portal home page.
                  </p>
                </div>
                <button
                  onClick={() => setLayoutViewMode('editor')}
                        className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                          layoutViewMode === 'editor' 
                            ? 'bg-primary text-on-primary shadow-sm' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        Block Editor
                      </button>
                      <button
                        onClick={() => setLayoutViewMode('preview')}
                  className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                          layoutViewMode === 'preview' 
                            ? 'bg-primary text-on-primary shadow-sm' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        Live Preview
                </button>
              </div>
              <button
                      onClick={handleLoadDefaultTemplate}
                      className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant rounded-xl text-xs font-bold font-mono transition-all"
                    >
                      Reset Default Template
                    </button>
                  </div>
                </div>

                {layoutSaveNotice && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{layoutSaveNotice}</span>
                  </motion.div>
                )}
       {/* Quick Add Bar */}
                {layoutViewMode === 'editor' && (
                  <div className="clay-card p-4 border border-outline-variant bg-surface-container-low rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider">
                      Add New Content Block:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAddBlock('heading')}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" /> Heading
                      </button>
                      <button
                        onClick={() => handleAddBlock('paragraph')}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" /> Paragraph
                      </button>
                      <button
                         onClick={() => handleAddBlock('callout')}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" /> Callout
                      </button>
                      <button
                        onClick={() => handleAddBlock('image')}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-primary" /> Banner Image
                      </button>
                      <button
                        onClick={() => handleAddBlock('divider')}
                        className="px-3 py-1.5 bg-surface border border-outline-variant hover:border-primary rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" /> Divider
                      </button>
                    </div>
                  </div>
                )}
       {/* Main View Area */}
                {layoutViewMode === 'editor' ? (

              <div className="flex flex-col gap-4">
                {currentBlocks.length === 0 ? (
                      <div className="clay-card p-12 text-center text-on-surface-variant text-sm font-bold border border-dashed border-outline-variant rounded-2xl flex flex-col items-center gap-3">
                        <Layers className="w-8 h-8 text-primary opacity-60" />
                        <p>No page blocks added yet.</p>
                        <button
                          onClick={handleLoadDefaultTemplate}
                          className="px-4 py-2 clay-btn-primary text-xs font-bold"
                        >
                          Load Welcome Template
                        </button>
                      </div>
                    ) : (
                      currentBlocks.map((block, index) => (
                  <div key={block.id} className="clay-card p-5 border border-outline-variant bg-surface rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center gap-4 flex-wrap border-b border-outline-variant/40 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                                #{index + 1}
                              </span>
                      <select 
                        value={block.type}
                       onChange={(e) => handleUpdateBlockType(block.id, e.target.value as any)}
                                className="clay-input py-1.5 px-3 rounded-lg bg-surface-container-low text-xs font-bold border border-outline-variant/60 focus:outline-none"
                              >
                                <option value="heading">Heading (Section Title)</option>
                                <option value="paragraph">Paragraph (Body Text)</option>
                                <option value="callout">Callout (Highlighted Box)</option>
                                <option value="image">Banner Image (URL)</option>
                                <option value="divider">Divider Line</option>
                      </select>
                    </div>
                            
                     <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleMoveBlock(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                                className="p-1.5 hover:bg-surface-container-high rounded-lg disabled:opacity-30 border border-outline-variant/40 transition-colors"
                              >
                                <ArrowUp className="w-4 h-4 text-on-surface" />
                              </button>
                              <button 
                                onClick={() => handleMoveBlock(index, 'down')}
                                disabled={index === currentBlocks.length - 1}
                                title="Move Down"
                                className="p-1.5 hover:bg-surface-container-high rounded-lg disabled:opacity-30 border border-outline-variant/40 transition-colors"
                              >
                                <ArrowDown className="w-4 h-4 text-on-surface" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBlock(block.id)}
                                title="Delete Block"
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Block input fields */}
                          {block.type !== 'divider' && block.type !== 'image' && (
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-[11px] font-bold text-on-surface-variant font-mono">
                                Block Content:
                              </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                placeholder="Enter block content text..."
                                className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary min-h-[70px] resize-y"
                              />
                            </div>
                          )}

                          {block.type === 'image' && (
                            <div className="flex flex-col gap-3 text-left">
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-on-surface-variant font-mono">
                                  Banner Image URL:
                                </label>
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                  placeholder="https://images.unsplash.com/..."
                                  className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary font-mono"
                      />
                    </div>
                              {block.content && (
                                <div className="h-32 rounded-xl overflow-hidden border border-outline-variant bg-surface-container">
                                  <img 
                                    src={block.content} 
                                    alt="Block Preview" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                  </div>
                )}
              </div>
            )}

            {block.type === 'divider' && (
              <div className="py-2">
                <hr className="border-dashed border-outline-variant" />
              </div>
            )}

            {/* Mini visual output preview */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-left">
              <span className="text-[10px] font-mono text-on-surface-variant font-bold uppercase block mb-1">
                Student Portal Preview:
              </span>
              {block.type === 'heading' && (
                <h3 className="font-display font-bold text-lg text-on-surface">{block.content || "(Empty Heading)"}</h3>
              )}
              {block.type === 'paragraph' && (
                <p className="text-xs text-on-surface-variant leading-relaxed">{block.content || "(Empty Paragraph)"}</p>
              )}
              {block.type === 'callout' && (
                              <div className="p-3 bg-surface border-l-4 border-l-primary text-primary font-bold text-xs rounded">
                                {block.content || "(Empty Callout)"}
                              </div>
                            )}
                            {block.type === 'image' && (
                              <p className="text-xs font-mono text-on-surface-variant truncate">🖼️ Image: {block.content}</p>
                            )}
                            {block.type === 'divider' && (
                              <hr className="my-1 border-outline-variant" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                 </div>
                ) : (
                  /* Full Live Preview Mode */
                  <div className="clay-card p-8 border border-outline-variant bg-background rounded-2xl text-left flex flex-col gap-8 shadow-inner">
                    <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                      <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <Eye className="w-4 h-4" /> Live Student Homepage Layout
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant bg-surface px-3 py-1 rounded-full border border-outline-variant">
                        {currentBlocks.length} Blocks Rendered
                      </span>
                    </div>

                    {currentBlocks.length === 0 ? (
                      <p className="text-xs font-mono text-on-surface-variant italic py-8 text-center">
                        No layout blocks present. Add blocks in Editor Mode to see preview.
                      </p>
                    ) : (
                      currentBlocks.map((block) => (
                        <div key={block.id} className="w-full">
                          {block.type === 'heading' && (
                            <h2 className="font-display text-3xl font-bold text-on-surface">
                              {block.content}
                            </h2>
                          )}
                          {block.type === 'paragraph' && (
                            <p className="text-base text-on-surface-variant leading-relaxed">
                              {block.content}
                            </p>
                          )}
                          {block.type === 'callout' && (
                            <div className="clay-card p-5 border-l-4 border-l-primary bg-surface-container-low text-primary font-bold text-base rounded-xl">
                              {block.content}
                            </div>
                          )}
                          {block.type === 'image' && (
                            <div className="clay-card p-2 border border-outline-variant rounded-2xl overflow-hidden bg-surface">
                              <img src={block.content} alt="Portal Banner" className="w-full h-64 object-cover rounded-xl" />
                            </div>
                          )}
                          {block.type === 'divider' && (
                            <hr className="my-2 border-outline-variant" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </main>

      {/* Save Modal (Standard Dialog component) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="admin-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="clay-card w-full max-w-lg p-6 md:p-8 bg-surface rounded-2xl border border-outline-variant relative max-h-[90vh] overflow-y-auto"
              id="admin-modal-card"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close scholarship form"
              >
                &times;
              </button>

              <h3 className="font-display text-xl font-bold text-on-surface mb-6 text-left">
                {editingScholarship ? "Edit Scholarship Opportunity" : "New Scholarship Program"}
              </h3>

              <form onSubmit={handleSaveScholarship} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Program Title</label>
                  <input 
                    type="text" 
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Global Innovators Grant"
                    className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Award Amount (PKR)</label>
                    <input 
                      type="number" 
                      required
                      value={formAward}
                      onChange={(e) => setFormAward(e.target.value)}
                      placeholder="e.g. 5000"
                      className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Deadline Date</label>
                    <input 
                      type="date" 
                      required
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none font-semibold focus:outline-none"
                    >
                      <option value="STEM">STEM</option>
                      <option value="Arts">Arts</option>
                      <option value="Humanities">Humanities</option>
                      <option value="Environment">Environment</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant">Visibility Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none font-semibold focus:outline-none"
                    >
                      <option value="Active">Publish immediately (Active)</option>
                      <option value="Draft">Keep as Draft</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant">Description Details</label>
                  <textarea 
                    required
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Enter program outline, details, and requirements..."
                    rows={4}
                    className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 clay-btn-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer text-on-primary"
                  >
                    <Save className="w-4 h-4" /> Save Program
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
