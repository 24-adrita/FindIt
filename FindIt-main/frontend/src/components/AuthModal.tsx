"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Hash,
  Phone,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, register, googleLogin } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Canvas ref for dynamic neural constellation background
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync tab & errors when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTab(defaultTab);
      setError(null);
      setSuccessMsg(null);
    }
  }

  // Dynamic interactive neural constellation canvas animation
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || 400);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 600);

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener("resize", resize);

    // Neural nodes representing multimodal embedding tokens
    const nodeCount = 26;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 1.2,
      isCyan: Math.random() > 0.45,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connecting neural synapses
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const alpha = 0.22 * (1 - dist / 90);
            ctx.strokeStyle = `rgba(69, 181, 138, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // Draw pulsating nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(69, 181, 138, 0.85)";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#45B58A";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleTabChange = (newTab: "login" | "register") => {
    resetForm();
    setTab(newTab);
  };

  const handleGoogleSignIn = async () => {
  resetForm();
  setIsGoogleLoading(true);

  try {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId === "your_google_client_id_here") {
      setError(
        "Google Sign-In requires configuring NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend and GOOGLE_CLIENT_ID in backend."
      );
      return;
    }
    // Ensure Google Identity Services script is loaded
    if (typeof window !== "undefined" && (window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
      const handleCredentialResponse = async (response: any) => {
        const idToken = response?.credential;
        if (!idToken) {
          setError("Google sign-in did not return a credential token.");
          return;
        }
        try {
          await googleLogin({ idToken });
          setSuccessMsg("Signed in with Google successfully!");
          // Close modal after short delay
          setTimeout(() => {
            onClose();
            resetForm();
          }, 700);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Google sign-in failed.");
          setError(msg);
        }
      };

      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        // optional: auto_select: false,
      });
      (window as any).google.accounts.id.prompt();
    } else {
      setError("Google Identity Services script not loaded. Ensure script tag is present.");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign in with Google.";
    setError(message);
  } finally {
    setIsGoogleLoading(false);
  }
}; {
    resetForm();
    setIsGoogleLoading(true);

    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      // If a real Google Cloud Client ID is configured, redirect to live Google OAuth flow
      if (googleClientId && googleClientId !== "your_google_client_id_here") {
        const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/auth/google/callback` : "";
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=token&scope=email%20profile`;
        if (typeof window !== "undefined") {
          window.location.href = googleAuthUrl;
        }
        return;
      }

      setError(
        "Google Sign-In requires configuring NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend and GOOGLE_CLIENT_ID in backend. Please use email and password."
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google.";
      setError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      setSuccessMsg("Logged in successfully!");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        studentId,
        phone,
      });
      setSuccessMsg("Account registered successfully!");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginTab = tab === "login";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#171A18]/85 backdrop-blur-md transition-all animate-fadeIn">
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-4xl min-h-[570px] sm:min-h-[580px] bg-[#252B27] rounded-3xl shadow-2xl border border-[#383E39] overflow-hidden flex flex-col md:flex-row text-left text-[#F3F4EF]">
        
        {/* Global Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-2 text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#383E39] rounded-full transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* LEFT FORM PANE: Sign In Form (Visible when overlay is on right) */}
        {/* ======================================================== */}
        <div
          className={`w-full md:w-1/2 px-7 py-6 sm:px-9 sm:py-8 flex flex-col justify-between bg-[#252B27] text-[#F3F4EF] transition-all duration-500 ${
            !isLoginTab ? "md:opacity-0 md:pointer-events-none md:invisible" : "opacity-100 visible"
          } ${isLoginTab ? "block" : "hidden md:flex"}`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#171A18] text-[#45B58A] border border-[#383E39]">
                Citizen &amp; Student Access
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#F3F4EF] tracking-tight mt-1">
              Sign In to Find<span className="text-[#45B58A]">It</span>
            </h3>
            <p className="text-xs text-[#A9B0AA] mt-1">
              Enter your credentials to manage reported items and review verified matches.
            </p>

            {/* Mobile Tab Toggle */}
            <div className="flex md:hidden p-1 mt-4 bg-[#171A18] rounded-xl border border-[#383E39]">
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  tab === "login" ? "bg-[#45B58A] text-[#171A18] shadow-sm font-bold" : "text-[#A9B0AA]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("register")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  tab === "register" ? "bg-[#45B58A] text-[#171A18] shadow-sm font-bold" : "text-[#A9B0AA]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Alerts */}
            {error && isLoginTab && (
              <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && isLoginTab && (
              <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-[#171A18] border border-[#45B58A]/50 text-[#45B58A] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#45B58A] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Official Google OAuth Button */}
            <div className="mt-4">
              <button
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-[#171A18] hover:bg-[#1E2320] border border-[#383E39] hover:border-[#45B58A]/50 rounded-xl text-xs font-bold text-[#F3F4EF] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs group disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#45B58A]/30 border-t-[#45B58A] rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Sleek divider */}
              <div className="relative flex items-center justify-center my-3.5">
                <div className="border-t border-[#383E39] w-full" />
                <span className="bg-[#252B27] px-3 text-[10px] uppercase tracking-wider font-semibold text-[#A9B0AA]/80 shrink-0">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#A9B0AA] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B0AA]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com or admin@campus.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#A9B0AA]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-[11px] text-[#45B58A] hover:underline flex items-center gap-1 cursor-pointer transition"
                  >
                    {showLoginPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B0AA]" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#171A18]/30 border-t-[#171A18] rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to FindIt</span>
                    <ArrowRight className="w-4 h-4 text-[#171A18]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-[#383E39] mt-4">
            <span className="text-[10px] font-bold text-[#A9B0AA] uppercase tracking-wider block mb-2">
              ⚡ Quick Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@campus.edu");
                  setPassword("admin123");
                }}
                className="py-2 px-2 rounded-xl border border-[#383E39] bg-[#171A18] hover:bg-[#383E39] text-[11px] font-bold text-[#F3F4EF] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap className="w-3 h-3 text-[#45B58A]" />
                Fill Demo Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("student@campus.edu");
                  setPassword("student123");
                }}
                className="py-2 px-2 rounded-xl border border-[#383E39] bg-[#171A18] hover:bg-[#383E39] text-[11px] font-bold text-[#F3F4EF] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <User className="w-3 h-3 text-[#45B58A]" />
                Fill Demo Citizen
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT FORM PANE: Create Account Form (Visible when overlay is on left) */}
        {/* ======================================================== */}
        <div
          className={`w-full md:w-1/2 px-7 py-6 sm:px-9 sm:py-8 flex flex-col justify-between bg-[#252B27] text-[#F3F4EF] transition-all duration-500 ${
            isLoginTab ? "md:opacity-0 md:pointer-events-none md:invisible" : "opacity-100 visible"
          } ${!isLoginTab ? "block" : "hidden md:flex"}`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#171A18] text-[#45B58A] border border-[#383E39]">
                New Registration
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#F3F4EF] tracking-tight mt-1">
              Create Find<span className="text-[#45B58A]">It</span> Account
            </h3>
            <p className="text-xs text-[#A9B0AA] mt-1">
              Join Sylhet&apos;s verified network for lost and found recovery.
            </p>

            {/* Mobile Tab Toggle */}
            <div className="flex md:hidden p-1 mt-4 bg-[#171A18] rounded-xl border border-[#383E39]">
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  tab === "login" ? "bg-[#45B58A] text-[#171A18] shadow-sm font-bold" : "text-[#A9B0AA]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("register")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  tab === "register" ? "bg-[#45B58A] text-[#171A18] shadow-sm font-bold" : "text-[#A9B0AA]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Alerts */}
            {error && !isLoginTab && (
              <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && !isLoginTab && (
              <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-[#171A18] border border-[#45B58A]/50 text-[#45B58A] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#45B58A] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Official Google OAuth Button */}
            <div className="mt-3">
              <button
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-[#171A18] hover:bg-[#1E2320] border border-[#383E39] hover:border-[#45B58A]/50 rounded-xl text-xs font-bold text-[#F3F4EF] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs group disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#45B58A]/30 border-t-[#45B58A] rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Sleek divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-[#383E39] w-full" />
                <span className="bg-[#252B27] px-3 text-[10px] uppercase tracking-wider font-semibold text-[#A9B0AA]/80 shrink-0">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-[#A9B0AA] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B0AA]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full pl-10 pr-4 py-2 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#A9B0AA] mb-1">
                    Student ID / NID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A9B0AA]" />
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="2026-CSE / NID"
                      className="w-full pl-8 pr-2 py-2 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A9B0AA] mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A9B0AA]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01711-XXXXXX"
                      className="w-full pl-8 pr-2 py-2 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A9B0AA] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B0AA]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#A9B0AA]">
                    Create Password (min 6 chars)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="text-[11px] text-[#45B58A] hover:underline flex items-center gap-1 cursor-pointer transition"
                  >
                    {showRegisterPassword ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B0AA]" />
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2 bg-[#171A18] border border-[#383E39] rounded-xl text-xs text-[#F3F4EF] placeholder:text-[#A9B0AA]/50 focus:outline-none focus:border-[#45B58A] transition"
                  />
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#171A18] border border-[#383E39] text-[10px] text-[#A9B0AA] flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#45B58A] shrink-0 mt-0.5" />
                <span>Verified <strong>Citizen / Student</strong> account across Sylhet Metropolitan Hubs.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#45B58A] hover:bg-[#3ca37c] text-[#171A18] font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#171A18]/30 border-t-[#171A18] rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  "Create FindIt Account"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SLIDING OVERLAY PANEL (DESKTOP): Glides smoothly left/right */}
        {/* ======================================================== */}
        <div
          className={`hidden md:flex absolute top-0 bottom-0 left-0 w-1/2 z-20 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isLoginTab ? "translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="w-full h-full p-8 flex flex-col justify-between text-[#F3F4EF] relative overflow-hidden border-x border-[#383E39] shadow-2xl bg-[#1E2320]">
            {/* Live Interactive Neural Constellation Canvas Animation */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0"
            />

            {/* Subtle Emerald Glow */}
            <div className="absolute -top-16 -left-16 w-60 h-60 rounded-full blur-3xl pointer-events-none bg-[#45B58A]/10" />
            <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full blur-3xl pointer-events-none bg-[#45B58A]/10" />

            {/* Top Status Bar with clearance for close button */}
            <div className={`relative z-10 flex items-center justify-between ${isLoginTab ? "pr-8" : ""}`}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-[#383E39] bg-[#171A18] text-[#45B58A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45B58A] animate-ping" />
                Sylhet Metropolitan Network
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A9B0AA]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#45B58A]" />
                <span>Verified Portal</span>
              </div>
            </div>

            {/* Cyber Scanner with Multimodal Reticle */}
            <div className="relative z-10 my-auto text-center py-2">
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                {/* Tech Circle */}
                <svg
                  className="absolute inset-0 w-full h-full animate-spin [animation-duration:24s] text-[#45B58A]/30"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeDasharray="12 12"
                  />
                </svg>

                {/* Central Shield */}
                <div className="relative w-22 h-22 rounded-3xl flex items-center justify-center text-[#45B58A] bg-[#171A18] border border-[#383E39] shadow-xl overflow-hidden">
                  <ShieldCheck className="w-11 h-11 text-[#45B58A]" />
                  {/* Moving Cyber Laser Scanline */}
                  <div className="absolute left-0 right-0 h-1 bg-[#45B58A] shadow-[0_0_10px_#45B58A] animate-cyber-scan" />
                </div>
              </div>

              {/* Status Indicator Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#171A18] border border-[#383E39] text-[#A9B0AA] mt-2 mb-1 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45B58A] animate-pulse" />
                <span>Live Matching Network Active</span>
              </div>

              {/* Dynamic Overlay Text depending on Tab */}
              <div className="mt-2 space-y-1.5 px-2">
                {isLoginTab ? (
                  <>
                    <h4 className="text-xl font-black text-[#F3F4EF] tracking-tight">
                      New to Find<span className="text-[#45B58A]">It</span>?
                    </h4>
                    <p className="text-xs text-[#A9B0AA] max-w-xs mx-auto leading-relaxed">
                      Create an account to report lost belongings, turn in found items, and get automatically matched across Sylhet.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="text-xl font-black text-[#F3F4EF] tracking-tight">
                      Welcome Back!
                    </h4>
                    <p className="text-xs text-[#A9B0AA] max-w-xs mx-auto leading-relaxed">
                      Sign in to check the status of your reported items, review match alerts, and securely verify your ownership.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Sliding Overlay Action Button */}
            <div className="relative z-10 pt-2 space-y-2">
              {isLoginTab ? (
                <button
                  type="button"
                  onClick={() => handleTabChange("register")}
                  className="w-full py-3 px-5 rounded-2xl bg-[#171A18] hover:bg-[#252B27] border border-[#383E39] hover:border-[#45B58A]/50 text-[#F3F4EF] font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md group cursor-pointer"
                >
                  <span>Create an Account</span>
                  <ArrowRight className="w-4 h-4 text-[#45B58A] group-hover:translate-x-1 transition" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTabChange("login")}
                  className="w-full py-3 px-5 rounded-2xl bg-[#171A18] hover:bg-[#252B27] border border-[#383E39] hover:border-[#45B58A]/50 text-[#F3F4EF] font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md group cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#45B58A] group-hover:-translate-x-1 transition" />
                  <span>Sign In to Your Account</span>
                </button>
              )}

              {/* Trust Footer */}
              <div className="flex items-center justify-between text-[11px] text-[#A9B0AA] px-1 pt-2 border-t border-[#383E39] font-medium">
                <span className="flex items-center gap-1.5 text-[#A9B0AA]">
                  <Lock className="w-3.5 h-3.5 text-[#45B58A]" /> Private &amp; Secure
                </span>
                <span className="flex items-center gap-1.5 text-[#A9B0AA]">
                  <MapPin className="w-3.5 h-3.5 text-[#45B58A]" /> Sylhet Metropolitan Area
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
