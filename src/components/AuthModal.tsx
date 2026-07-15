import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Key, Loader2, Check, X, LogIn } from "lucide-react";
import { UserSession } from "../types.js";
import { auth } from "../lib/firebase.js";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  mfaEnabledGlobal: boolean;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, mfaEnabledGlobal }: AuthModalProps) {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'credentials' | 'mfa' | 'requestAccess' | 'requestSent'>('credentials');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Access Request Form State (Google Docs style)
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email) {
        throw new Error("No email associated with this Google Account.");
      }

      const targetEmail = user.email.trim().toLowerCase();
      const targetName = user.displayName || user.email.split('@')[0];
      const targetAvatar = user.photoURL || undefined;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, name: targetName, role, avatar: targetAvatar })
      });

      setLoading(false);

      if (response.ok) {
        const data = await response.json();
        if (mfaEnabledGlobal) {
          setStep('mfa');
          setEmail(targetEmail);
        } else {
          onLoginSuccess({
            user: {
              ...data.user,
              avatar: targetAvatar || data.user.avatar
            },
            mfaVerified: false,
            needsMfa: false
          });
          onClose();
        }
      } else {
        const data = await response.json();
        if (response.status === 403) {
          setRequestEmail(targetEmail);
          setRequestName(targetName);
          setRequestMessage('');
          setStep('requestAccess');
        } else {
          setError(data.message || data.error || "Authentication failed.");
        }
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setLoading(false);
      if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized. Please add it in Firebase Console > Authentication > Settings > Authorized domains.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in popup was closed before completing authentication.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled. Go to Firebase Console > Authentication > Sign-in method, enable Google, and save.");
      } else {
        setError(`Error (${err.code}): ${err.message || "Failed to authenticate with Google."}`);
      }
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) {
      setError("Please provide your name.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: requestName,
          email: requestEmail,
          message: requestMessage
        })
      });
      if (response.ok) {
        setStep('requestSent');
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection error during access request.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit passcode.');
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);

    const targetName = email === 'abdullah.binnasir.abn@gmail.com' ? 'Abdullah Bin Nasir' : 'Sarah Jenkins';
    onLoginSuccess({
      user: {
        name: targetName,
        email: email,
        role: role,
        avatar: role === 'admin' 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmOHh6_tzgokYQIwRCQFyO4VsX2-SQV3efippR63wqB3fAn_TWyQXA-jAJyup0zkKdk4n9hyLmv3JmUxKpdqGszUyI93VcVbDg-CLSzrhYyhXgGduPWynG6urf5cM7OTN7vGihoi2eloj7GPfeIPAPA_GVR6xvrW9iwEfGMFvVOtXCLIT8CiXHd4PKI1B7MBixcXF8AbZNyqGGlYF73Ch6ehkFCsAjXqD5Rkzh5avYNbkCGGveOf1rhN91KI8jTocut3hV7QZAZ0'
          : undefined
      },
      mfaVerified: true,
      needsMfa: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="auth-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-md p-8 clay-card bg-surface text-on-surface rounded-2xl relative"
        id="auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'credentials' ? (
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="font-display text-headline-md font-bold tracking-tight text-on-surface" id="auth-modal-title">
                Zaneen Secure Auth
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Select your identity below to access the platform
              </p>
            </div>

            {/* Role selection toggle */}
            <div className="flex p-1 bg-surface-container-high rounded-xl mb-6">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  role === 'student'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => {
                  setRole('student');
                  setError('');
                }}
              >
                Student Portal
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  role === 'admin'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => {
                  setRole('admin');
                  setError('');
                }}
              >
                Admin Suite
              </button>
            </div>

            <div className="flex flex-col gap-4 text-center font-sans">
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-2 leading-relaxed">
                Click below to securely sign in using your Google account. 
                {role === 'admin' ? " Ensure you use an authorized administrator email." : ""}
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 bg-surface hover:bg-surface-container border border-outline-variant rounded-xl font-bold text-sm text-on-surface hover:text-primary hover:border-primary text-center flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <LogIn className="w-5 h-5 text-primary" />
                )}
                <span>Sign In with Google</span>
              </button>

              {error && <p className="text-xs text-error font-medium mt-1">{error}</p>}
            </div>
          </div>
        ) : step === 'requestAccess' ? (
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mb-3 border border-amber-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Access Required
              </h2>
              <p className="text-xs text-on-surface-variant mt-2 px-1">
                The account <span className="font-mono font-bold text-primary">{requestEmail}</span> does not have administrator permissions. You can ask for access from the owner.
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Your Name</label>
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  className="clay-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low border-none text-on-surface font-semibold"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Message (Optional)</label>
                <textarea
                  placeholder="Type a message why you need admin access, just like sharing in Google Docs..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="clay-input rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low border-none text-on-surface min-h-[90px] leading-relaxed"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                  }}
                  className="flex-1 py-3 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold transition-all text-on-surface"
                >
                  Switch Account
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 clay-btn-primary font-bold text-xs flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Ask for Access</span>
                </button>
              </div>
            </form>
          </div>
        ) : step === 'requestSent' ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4 animate-bounce border border-emerald-500/20">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Access Request Sent
            </h2>
            <p className="text-xs text-on-surface-variant mt-2 px-6 leading-relaxed">
              Your request for access has been submitted to <span className="font-semibold text-primary">abdullah.binnasir.abn@gmail.com</span>. You will be able to access the Admin Panel once approved.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 clay-btn-primary font-bold text-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleMfaSubmit}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mb-3 border border-amber-500/20">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="font-display text-headline-md font-bold tracking-tight text-on-surface">
                Two-Factor Security (MFA)
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 px-4">
                Enter the verification code to finish signing in.
              </p>
              <div className="mt-3 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs font-mono text-amber-700 dark:text-amber-300">
                Demo Code: <span className="font-bold underline">123456</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="clay-input rounded-xl p-4 text-center text-xl font-mono tracking-widest bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary border-none text-on-surface"
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-error text-center font-medium">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="flex-1 py-3 border border-outline-variant hover:bg-surface-container rounded-xl text-xs font-bold transition-all text-on-surface"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 clay-btn-primary font-bold text-xs flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify Code</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
