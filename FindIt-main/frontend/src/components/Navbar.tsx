"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Menu,
  X,
  Search,
  LogIn,
  LogOut,
  User as UserIcon,
  ClipboardList,
  Shield,
  HelpCircle,
  MapPin,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  onOpenWeights?: () => void;
  onOpenProposal?: () => void;
  onOpenHowItWorks?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenAuth?: (tab: "login" | "register") => void;
}

export default function Navbar({
  onNavigateSection,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (pathname === "/" && onNavigateSection) {
      onNavigateSection(id);
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2C342E] bg-[#141715]/90 backdrop-blur-xl animate-slide-down">
      {/* Specular hairline highlight along top border with emerald glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#45B58A]/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Branding + Live Status Indicator */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1C221E] border border-[#313A33] text-[#45B58A] group-hover:border-[#45B58A]/60 group-hover:scale-105 transition-all shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-[#F3F4EF]">
                  Find<span className="text-[#45B58A]">It</span>
                </span>
              </div>
            </Link>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-[#1C221E] text-[#C4CBC5] border border-[#313A33] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#45B58A] animate-pulse" />
              <span>SYLHET</span>
            </div>
          </div>

          {/* Desktop Navigation Links with Interactive Hover Pills */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <Link
              href="/explore"
              className={`relative group px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                pathname === "/explore"
                  ? "text-[#45B58A] bg-[#1C221E] border border-[#45B58A]/40 shadow-xs"
                  : "text-[#C4CBC5] hover:text-[#F3F4EF]"
              }`}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#45B58A]" />
                Explore Items
              </span>
              <span className="absolute inset-0 rounded-xl bg-[#252B27] border border-[#383E39] opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none" />
            </Link>

            <button
              onClick={() => scrollTo("how-it-works")}
              className="relative group px-3.5 py-1.5 text-xs font-semibold text-[#C4CBC5] hover:text-[#F3F4EF] rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#A2ABA4]" />
                How It Works
              </span>
              <span className="absolute inset-0 rounded-xl bg-[#1C221E] border border-[#313A33] opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none" />
            </button>

            <Link
              href="/map"
              className={`relative group px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                pathname === "/map"
                  ? "text-[#45B58A] bg-[#1C221E] border border-[#45B58A]/40 shadow-xs"
                  : "text-[#C4CBC5] hover:text-[#F3F4EF]"
              }`}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#45B58A]" />
                Map
              </span>
              <span className="absolute inset-0 rounded-xl bg-[#1C221E] border border-[#313A33] opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none" />
            </Link>

            <Link
              href="/benchmark"
              className={`relative group px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                pathname === "/benchmark"
                  ? "text-[#45B58A] bg-[#1C221E] border border-[#45B58A]/40 shadow-xs"
                  : "text-[#C4CBC5] hover:text-[#F3F4EF]"
              }`}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#45B58A]" />
                <span>AI Benchmark</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-[#45B58A]/20 text-[#45B58A] border border-[#45B58A]/40">
                  350 Dataset
                </span>
              </span>
              <span className="absolute inset-0 rounded-xl bg-[#1C221E] border border-[#313A33] opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 pointer-events-none" />
            </Link>

            {/* Student & Admin Protected Nav Links */}
            {user && (
              <Link
                href="/my-claims"
                className="relative group px-3.5 py-1.5 text-xs font-medium text-[#C4CBC5] hover:text-[#F3F4EF] rounded-xl transition-all"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-[#A2ABA4]" />
                  My Claims
                </span>
                <span className="absolute inset-0 rounded-xl bg-[#1C221E] border border-[#313A33] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none" />
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#45B58A] bg-[#45B58A]/15 hover:bg-[#45B58A]/25 rounded-xl transition border border-[#45B58A]/35 shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-[#45B58A]" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right Status Indicator & Auth Actions */}
          <div className="hidden sm:flex items-center gap-2.5 lg:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* In-App Notification Bell */}
                <NotificationBell />

                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C221E] border border-[#313A33] rounded-xl text-xs font-semibold text-[#F3F4EF]">
                  <UserIcon className="w-3.5 h-3.5 text-[#45B58A]" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      user.role === "admin"
                        ? "bg-[#45B58A]/20 text-[#45B58A] border border-[#45B58A]/40"
                        : "bg-[#28322A] text-[#45B58A] border border-[#45B58A]/30"
                    }`}
                  >
                    {user.role === "admin" ? "ADMIN" : "CITIZEN"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-[#A2ABA4] hover:text-rose-400 hover:bg-[#1C221E] rounded-xl transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.("login")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#C4CBC5] hover:text-[#F3F4EF] hover:bg-[#1C221E] rounded-xl transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#A2ABA4]" />
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth?.("register")}
                  className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold text-[#141715] bg-[#45B58A] hover:bg-[#3ca37c] rounded-xl shadow-md shadow-[#45B58A]/15 active:scale-95 transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button & notification */}
          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#252B27] transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#383E39] bg-[#171A18] p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="pt-2 space-y-1">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#252B27] rounded-xl text-left transition"
            >
              <Search className="w-4 h-4 text-[#45B58A]" />
              Explore Items
            </Link>

            <button
              onClick={() => scrollTo("how-it-works")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#252B27] rounded-xl text-left transition"
            >
              <HelpCircle className="w-4 h-4 text-[#A9B0AA]" />
              How It Works
            </button>

            <Link
              href="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#252B27] rounded-xl text-left transition"
            >
              <MapPin className="w-4 h-4 text-[#45B58A]" />
              Map
            </Link>

            <Link
              href="/benchmark"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#252B27] rounded-xl text-left transition"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-[#45B58A]" />
                <span>AI Benchmark &amp; Dataset</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#45B58A]/15 text-[#45B58A] border border-[#45B58A]/30">
                350 Pairs
              </span>
            </Link>

            {user && (
              <Link
                href="/my-claims"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#A9B0AA] hover:text-[#F3F4EF] hover:bg-[#252B27] rounded-xl text-left transition"
              >
                <ClipboardList className="w-4 h-4 text-[#A9B0AA]" />
                My Claims
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#45B58A] hover:bg-[#45B58A]/10 rounded-xl text-left transition"
              >
                <ShieldCheck className="w-4 h-4 text-[#45B58A]" />
                Admin Verification Portal
              </Link>
            )}
          </div>

          {!user && (
            <div className="pt-3 border-t border-[#383E39] flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.("login");
                }}
                className="flex-1 py-2 text-center text-xs font-semibold text-[#A9B0AA] bg-[#252B27] hover:bg-[#383E39] rounded-xl border border-[#383E39]"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.("register");
                }}
                className="flex-1 py-2 text-center text-xs font-bold text-[#171A18] bg-[#45B58A] hover:bg-[#3ca37c] rounded-xl"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
