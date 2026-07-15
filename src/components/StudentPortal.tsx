import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, Play, Search, Filter, Cpu, Award, Users, BookOpen, 
  MapPin, Sparkles, CheckCircle2, AlertCircle, FileText, Send, UserCheck, HelpCircle
} from "lucide-react";
import { Scholarship, Application, UserSession } from "../types.js";
import ZaneenLogo from "./ZaneenLogo.tsx";

interface StudentPortalProps {
  scholarships: Scholarship[];
  onApply: (scholarshipId: string, details: { studentName: string; studentEmail: string; gpa: string; income: string; essay: string }) => Promise<void>;
  userSession: UserSession;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
}

export default function StudentPortal({ scholarships, onApply, userSession, onOpenLogin, onLogout, onNavigateToAdmin }: StudentPortalProps) {
  // Profile state for matching
  const [gpa, setGpa] = useState("3.8");
  const [income, setIncome] = useState("under_50k");
  const [interest, setInterest] = useState("STEM");
  const [customKeywords, setCustomKeywords] = useState("");
  const [profileMolded, setProfileMolded] = useState(false);

  // Application flow state
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [applyName, setApplyName] = useState(userSession.user?.name || "");
  const [applyEmail, setApplyEmail] = useState(userSession.user?.email || "");
  const [studentGpa, setStudentGpa] = useState(gpa);
  const [studentIncome, setStudentIncome] = useState("$45,000");
  const [applyEssay, setApplyEssay] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Scroll effect for hero
  const [scrollScale, setScrollScale] = useState(1);
  const [scrollBorder, setScrollBorder] = useState("1.5rem");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 500;
      const scale = 1 + (Math.min(scrollY, maxScroll) / maxScroll) * 0.05;
      setScrollScale(scale);
      if (scrollY > 100) {
        setScrollBorder("0px");
      } else {
        setScrollBorder("1.5rem");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update applicant info when session changes
  useEffect(() => {
    if (userSession.user) {
      setApplyName(userSession.user.name);
      setApplyEmail(userSession.user.email);
    }
  }, [userSession]);

  // Compute match score for each active scholarship
  const getMatchScore = (scholarship: Scholarship) => {
    let score = 50; // baseline
    if (scholarship.category.toUpperCase() === interest.toUpperCase()) {
      score += 30;
    }
    // High GPA preference
    if (Number(gpa) >= 3.8 && scholarship.awardAmount >= 8000) {
      score += 15;
    }
    // Match based on custom keywords
    if (customKeywords) {
      const keywords = customKeywords.toLowerCase().split(/\s+/);
      const matches = keywords.filter(kw => 
        scholarship.title.toLowerCase().includes(kw) || 
        scholarship.description.toLowerCase().includes(kw)
      );
      score += matches.length * 10;
    }
    return Math.min(score, 100);
  };

  const activeScholarships = scholarships.filter(s => s.status === 'Active');
  
  // Sorted matches
  const matchedScholarships = [...activeScholarships].map(s => ({
    ...s,
    score: getMatchScore(s)
  })).sort((a, b) => b.score - a.score);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScholarship) return;
    
    setSubmitting(true);
    try {
      await onApply(selectedScholarship.id, {
        studentName: applyName,
        studentEmail: applyEmail,
        gpa: studentGpa,
        income: studentIncome,
        essay: applyEssay
      });
      setApplySuccess(true);
      setApplyEssay("");
      setTimeout(() => {
        setApplySuccess(false);
        setSelectedScholarship(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-on-background bg-background">
      {/* TopNavBar */}
      <nav 
        className="bg-surface/80 backdrop-blur-md m-4 w-[calc(100%-32px)] clay-card flex justify-between items-center px-6 py-4 sticky top-4 z-40 transition-all border border-outline-variant"
        id="navbar"
      >
        <div className="flex items-center gap-3">
          <ZaneenLogo size={36} showText={true} textColorClass="text-primary font-bold text-xl" layout="horizontal" />
          <span className="hidden sm:inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono rounded-full font-bold">
            Compliance Suite
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#explorer" className="text-primary font-bold border-b-2 border-primary pb-0.5 transition-all">Explorer</a>
          <a href="#mission" className="text-on-surface-variant hover:text-primary transition-all">About</a>
          <a href="#molder" className="text-on-surface-variant hover:text-primary transition-all">My Profile</a>
          <a href="#works" className="text-on-surface-variant hover:text-primary transition-all">How it Works</a>
        </div>

        <div className="flex items-center gap-4">
          {userSession.user?.role === 'admin' && onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="clay-btn-primary px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase shadow-sm"
              id="admin-suite-nav-btn"
            >
              Admin Suite
            </button>
          )}
          {userSession.user ? (
            <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm border border-primary overflow-hidden">
                {userSession.user.avatar ? (
                  <img 
                    src={userSession.user.avatar} 
                    alt={userSession.user.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  userSession.user.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface truncate max-w-[120px]">{userSession.user.name}</span>
                <span className="text-[10px] font-mono text-on-surface-variant capitalize">{userSession.user.role}</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-xs font-mono font-bold text-red-600 hover:text-red-700 underline focus:outline-none pl-2 border-l border-outline-variant"
                aria-label="Logout"
              >
                Exit
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenLogin}
              className="clay-btn-primary px-6 py-2 text-sm font-bold flex items-center gap-2 cursor-pointer focus:ring-2 focus:ring-primary"
              aria-label="Log in to Zaneen"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-[75vh] px-4 md:px-12 py-8 overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 m-4 md:m-8 overflow-hidden transition-all duration-500 clay-card z-0 border border-outline-variant" 
          id="hero-img-container"
          style={{ 
            borderRadius: scrollBorder,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-surface-container-highest/60 mix-blend-multiply z-10"></div>
          <motion.img 
            style={{ scale: scrollScale }}
            className="w-full h-full object-cover origin-center"
            alt="A student in graduation gown holding a diploma smiling"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSsKJjdjCWzR8EShm41TU_B6V0S4EEfdq-prxiJ6fmWGAAWV_Pfr4xh1ipz-qW7zTCXjH_ZKl_vBKk6fyTrUjRKEOOgtAl1ljs3kJN_s3ONDLHhLToPBA3IQT7HNSvd-LbrSeqy-B78266hjAgtNUVAk3I22yLE-BOpRP45gNFGfj4xwoqStdGNdmCc17YLSwPolGYSB9LKPn1pqyDbIqURok4Oa5RbY36ytjCn24nBr6mdrM-Vd1bmPI0yeO8lRhaQ20_mhRfq2I"
          />
        </div>

        <div className="relative z-20 text-center max-w-3xl mx-auto px-6 py-12 clay-card bg-surface/90 backdrop-blur-md border border-outline-variant">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-on-surface mb-6 leading-tight tracking-tight">
            Shape Your Academic Future
          </h1>
          <p className="font-body-lg text-lg sm:text-xl text-on-surface-variant mb-8 max-w-2xl mx-auto">
            Discover scholarships tailored to your unique journey. A beautifully crafted platform designed to make finding and applying for financial aid feel seamless, grounded, and intuitive.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="#molder" 
              className="clay-btn-primary px-8 py-4 text-base font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg text-on-primary"
            >
              Start Exploring <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#works" 
              className="clay-card px-8 py-4 text-base font-bold text-primary hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 border border-outline-variant"
            >
              How it Works <Play className="w-5 h-5 fill-primary" />
            </a>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 px-4 md:px-12 max-w-7xl mx-auto" id="mission">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="clay-card p-8 md:p-12 border border-outline-variant flex flex-col gap-6 text-left">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary">
              Our Mission
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-on-surface-variant">
              We believe that finding financial support for education shouldn't feel like navigating a maze. Zaneen brings a tactile, human-centric approach to scholarship discovery. By molding a soft, approachable interface, we aim to reduce the anxiety often associated with applications.
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-on-surface-variant">
              Our platform is built on the idea that every student's path is unique. We provide the tools to shape your search, ensuring you find the resources that perfectly fit your academic mold.
            </p>
          </div>
          <div className="relative h-[400px] w-full clay-card overflow-hidden border border-outline-variant">
            <div className="absolute inset-0 bg-surface-container-highest opacity-20"></div>
            <img 
              className="w-full h-full object-cover hover:scale-105 transition-all duration-700" 
              alt="Sleek laptop showing a tactile clay dashboard" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiT2vqv-SeGdpWLEXlKEK_KyYNT-8x7zTRGS8-NUGOsVzVDTRjvDOrKWpPQTvL1i_hxL4DqlZcBZcVnlZYWaFUztByoBEtLSVdngTzMJTm6tFaravA8CzCMyFGjmJhuykQ1WXRQwyKuhW6VT4eMs2Fhqc6c3VgzPhqfmDgGPLPugirzTzCYTcu70MKshpf6Lu_WBqUgr6N7jyYvw3StcueMyj-41WOXAOTwzioRrQfmWAbRHv0ST70pAF78Fxm3kM3yUzTxn3aXe0"
            />
          </div>
        </div>
      </section>

      {/* Profile Molder & Intelligent Matching Engine */}
      <section className="py-16 bg-surface-container-low border-y border-outline-variant px-4 md:px-12" id="molder">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
              Interactive matching engine
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-on-surface mt-3">
              Mold Your Student Profile
            </h2>
            <p className="text-base text-on-surface-variant max-w-2xl mx-auto mt-2">
              Our intelligent system instantly sifts opportunities and calculates real-time matching compatibility scores based on your background.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* The Mold Form (Left 5 columns) */}
            <div className="lg:col-span-5 clay-card p-6 md:p-8 border border-outline-variant flex flex-col gap-5 text-left bg-surface">
              <h3 className="font-display text-xl font-bold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Profile Parameters
              </h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Cumulative GPA</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="2.0" 
                    max="4.0" 
                    step="0.1" 
                    value={gpa} 
                    onChange={(e) => {
                      setGpa(e.target.value);
                      setProfileMolded(true);
                    }}
                    className="w-full accent-primary h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer"
                  />
                  <span className="font-mono font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg min-w-[50px] text-center">
                    {Number(gpa).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Annual Household Income</label>
                <select 
                  value={income}
                  onChange={(e) => {
                    setIncome(e.target.value);
                    setProfileMolded(true);
                  }}
                  className="clay-input p-3 rounded-xl bg-surface-container-low text-sm font-semibold border-none focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="under_30k">Under $30,000 / year</option>
                  <option value="under_50k">$30,000 - $60,000 / year</option>
                  <option value="under_100k">$60,000 - $100,000 / year</option>
                  <option value="above_100k">Above $100,000 / year</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Academic Area of Interest</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["STEM", "Arts", "Humanities", "Environment"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setInterest(cat);
                        setProfileMolded(true);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        interest === cat 
                          ? 'bg-primary text-on-primary border-primary shadow-sm' 
                          : 'bg-surface hover:bg-surface-container-high text-on-surface-variant border-outline-variant'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Custom Keyword Sifter (Optional)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="e.g. computer, space, global, carbon..."
                    value={customKeywords}
                    onChange={(e) => {
                      setCustomKeywords(e.target.value);
                      setProfileMolded(true);
                    }}
                    className="clay-input pl-10 pr-4 py-2.5 rounded-xl text-xs w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-primary block mb-1">💡 Real-time Clay Sifting</span>
                Changing any slider or toggle instantly recalculates matching percentages on the right. Set your parameters to discover high-value grants matching your goals.
              </div>
            </div>

            {/* Matched Feed (Right 7 columns) */}
            <div className="lg:col-span-7 flex flex-col gap-4 text-left" id="explorer">
              <div className="flex justify-between items-center px-2">
                <h4 className="font-display font-bold text-lg text-on-surface">
                  Matched Scholarships ({matchedScholarships.length})
                </h4>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary">
                  <Filter className="w-3.5 h-3.5" /> Ordered by Relevance
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[560px] overflow-y-auto pr-1">
                {matchedScholarships.map((scholarship) => {
                  const score = scholarship.score;
                  return (
                    <motion.div
                      layout
                      key={scholarship.id}
                      className="clay-card p-5 border border-outline-variant bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-secondary-container text-on-secondary-container">
                            {scholarship.category}
                          </span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            Match Score: {score}%
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-on-surface mt-2">
                          {scholarship.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                          {scholarship.description}
                        </p>
                        <div className="flex gap-4 mt-3 text-xs font-mono text-on-surface-variant">
                          <span>Deadline: <b>{scholarship.deadline}</b></span>
                          <span>Value: <b className="text-primary">${scholarship.awardAmount.toLocaleString()}</b></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedScholarship(scholarship);
                          setStudentGpa(gpa);
                          setApplyEssay("");
                        }}
                        className="clay-btn-primary px-4 py-2.5 text-xs font-bold flex-shrink-0 cursor-pointer text-on-primary"
                        aria-label={`Apply to ${scholarship.title}`}
                      >
                        Submit with Ease
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-surface px-4 md:px-12 border-b border-outline-variant" id="works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-on-surface mb-3">
              How It Works
            </h2>
            <p className="font-body-lg text-lg text-on-surface-variant max-w-2xl mx-auto">
              A seamless, three-step process designed to get you from searching to applying with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="clay-card p-8 flex flex-col items-center text-center border border-outline-variant bg-surface">
              <div className="w-16 h-16 rounded-full clay-card flex items-center justify-center text-primary mb-6 bg-surface-container">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-3">
                1. Mold Your Profile
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Input your interests, academic history, and goals into our soft-touch forms to create a personalized foundation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="clay-card p-8 flex flex-col items-center text-center border border-outline-variant bg-surface">
              <div className="w-16 h-16 rounded-full clay-card flex items-center justify-center text-primary mb-6 bg-surface-container">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-3">
                2. Discover Matches
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Our intelligent system sifts through thousands of opportunities, presenting only those that fit your unique shape.
              </p>
            </div>

            {/* Step 3 */}
            <div className="clay-card p-8 flex flex-col items-center text-center border border-outline-variant bg-surface">
              <div className="w-16 h-16 rounded-full clay-card flex items-center justify-center text-primary mb-6 bg-surface-container">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-3">
                3. Submit with Ease
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Track deadlines and submit applications directly through our beautifully structured, stress-free dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest text-on-background py-12 px-4 md:px-12 border-t border-outline-variant">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <ZaneenLogo size={28} showText={true} textColorClass="text-primary font-bold text-lg" layout="horizontal" />
            <span className="text-xs text-on-surface-variant">© 2026 Zaneen. Built with precision.</span>
          </div>
          <div className="flex gap-6 text-sm text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* Application Submission Modal */}
      <AnimatePresence>
        {selectedScholarship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="apply-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="clay-card w-full max-w-lg p-6 md:p-8 bg-surface rounded-2xl border border-outline-variant relative max-h-[90vh] overflow-y-auto"
              id="apply-modal-card"
            >
              <button 
                onClick={() => setSelectedScholarship(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close application form"
              >
                &times;
              </button>

              <h3 className="font-display text-xl font-bold text-on-surface mb-1 text-left">
                Submit with Ease
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 text-left">
                Apply directly to <b>{selectedScholarship.title}</b>. Value: <span className="text-primary font-bold">${selectedScholarship.awardAmount.toLocaleString()}</span>
              </p>

              {applySuccess ? (
                <div className="p-6 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-center flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                  <h4 className="font-display font-bold text-base text-emerald-400">Application Submitted!</h4>
                  <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                    Your application has been received, and simulated security logging audit hashes have been successfully recorded in the main console logs.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="flex flex-col gap-4 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Applicant Name</label>
                      <input 
                        type="text" 
                        required
                        value={applyName}
                        onChange={(e) => setApplyName(e.target.value)}
                        placeholder="John Doe"
                        className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Contact Email</label>
                      <input 
                        type="email" 
                        required
                        value={applyEmail}
                        onChange={(e) => setApplyEmail(e.target.value)}
                        placeholder="john.doe@gmail.com"
                        className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">GPA Verification</label>
                      <input 
                        type="text" 
                        required
                        value={studentGpa}
                        onChange={(e) => setStudentGpa(e.target.value)}
                        placeholder="3.8"
                        className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant">Annual Household Income</label>
                      <input 
                        type="text" 
                        required
                        value={studentIncome}
                        onChange={(e) => setStudentIncome(e.target.value)}
                        placeholder="$45,000"
                        className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant flex justify-between">
                      <span>Statement of Purpose / Essay</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">
                        {applyEssay.length} / 500 chars minimum
                      </span>
                    </label>
                    <textarea 
                      required
                      value={applyEssay}
                      onChange={(e) => setApplyEssay(e.target.value)}
                      placeholder="Tell us about how this program will shape your professional goals or research..."
                      rows={4}
                      className="clay-input p-3 rounded-xl bg-surface-container-low text-xs border-none focus:ring-2 focus:ring-primary resize-none"
                    ></textarea>
                  </div>

                  {!userSession.user && (
                    <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/20 text-[11px] text-amber-300 flex gap-2 items-start leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>
                        You are submitting as a guest student. Sign in with Google to pre-populate parameters and bind submissions to your active profile session.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button"
                      onClick={() => setSelectedScholarship(null)}
                      className="flex-1 py-3 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting || applyEssay.length < 10}
                      className="flex-1 py-3 clay-btn-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      {submitting ? "Securing API..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
