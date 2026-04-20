import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  ShoppingCart,
  Users,
  TrendingUp,
  ShieldCheck,
  Star,
  ChevronRight,
  Leaf,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle2,
  Truck,
  BarChart3,
  Handshake,
  Play,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Marketplace from "@/components/Marketplace";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

/* ─────────────────────────────────────────── */
/*  Tiny animated number hook                  */
/* ─────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);
  return value;
}

/* ─────────────────────────────────────────── */
/*  Product cards strip data                   */
/* ─────────────────────────────────────────── */
const featuredItems = [
  { name: "Golden Mangoes", farm: "Sunrise Farm", price: "$3.50/kg", tag: "Seasonal", color: "from-amber-400/20 to-orange-300/10", img: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop", alt: "Fresh Golden Mangoes harvest from Sunrise Farm" },
  { name: "Heirloom Tomatoes", farm: "Red Soil Co.", price: "$4.20/kg", tag: "Organic", color: "from-red-400/20 to-rose-300/10", img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=300&fit=crop", alt: "Organic Heirloom Tomatoes basket from Red Soil Co." },
  { name: "Sweet Corn", farm: "Prairie Roots", price: "$1.80/ear", tag: "Fresh", color: "from-yellow-400/20 to-lime-300/10", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop", alt: "Fresh Sweet Corn ears from Prairie Roots farm" },
  { name: "Baby Spinach", farm: "GreenThumb", price: "$2.90/bag", tag: "Certified", color: "from-emerald-400/20 to-green-300/10", img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop", alt: "Certified Baby Spinach bag from GreenThumb fields" },
  { name: "Fresh Strawberries", farm: "Berry Valley", price: "$5.60/kg", tag: "Top Pick", color: "from-pink-400/20 to-red-300/10", img: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop", alt: "Top Pick Fresh Strawberries box from Berry Valley" },
  { name: "Purple Eggplant", farm: "Dusk Hill Farm", price: "$3.10/kg", tag: "Exotic", color: "from-purple-400/20 to-violet-300/10", img: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=300&h=300&fit=crop", alt: "Exotic Purple Eggplant from Dusk Hill Farm" },
];

/* ─────────────────────────────────────────── */
/*  Stats row data                             */
/* ─────────────────────────────────────────── */
const stats = [
  { label: "Active Users", value: 250000, suffix: "k+", display: "250k+", icon: Users, color: "text-sky-500", bg: "bg-sky-500/10" },
  { label: "Daily Orders", value: 8500, suffix: "+", display: "8.5k+", icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Regions Covered", value: 48, suffix: "+", display: "48+", icon: Globe, color: "text-violet-500", bg: "bg-violet-500/10" },
  { label: "YoY Growth", value: 142, suffix: "%", display: "142%", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
];

/* ─────────────────────────────────────────── */
/*  How-it-works steps                         */
/* ─────────────────────────────────────────── */
const steps = [
  {
    step: "01",
    title: "Farmers Post Harvest",
    desc: "Farmers list fresh produce directly on our live marketplace with real-time transparent pricing and AI-suggested rates.",
    icon: Leaf,
    accent: "from-emerald-500 to-green-400",
  },
  {
    step: "02",
    title: "Buyers Order Direct",
    desc: "Browse local listings, compare verified produce, and place orders straight from the farm — zero middlemen.",
    icon: ShoppingCart,
    accent: "from-sky-500 to-cyan-400",
  },
];
/* ─────────────────────────────────────────── */
/*  Landing Page Navbar (unauthenticated)       */
/* ─────────────────────────────────────────── */
function LandingNav({ onBrowse, onLogin }: { onBrowse: () => void; onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-black/30">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <span className={`text-lg font-extrabold tracking-tight transition-colors duration-300 ${scrolled ? "text-foreground" : "text-white drop-shadow"}`}>
            wakulima agri-connect
          </span>
        </div>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {["Marketplace", "Farmers", "Mission", "Community"].map((item) => (
            <button
              key={item}
              onClick={item === "Marketplace" ? onBrowse : undefined}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${scrolled
                  ? "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full transition-all ${scrolled ? "" : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            onClick={onLogin}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="rounded-full px-5 bg-emerald-500 hover:bg-emerald-400 text-white border-0 shadow-lg shadow-black/30 hover:scale-105 transition-all text-xs font-semibold"
            onClick={onLogin}
          >
            Get Started <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? "hover:bg-secondary/60" : "text-white hover:bg-white/10"
            }`}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 px-6 pb-6 pt-2 space-y-1">
          {["Marketplace", "Farmers", "Mission", "Community"].map((item) => (
            <button
              key={item}
              onClick={() => { if (item === "Marketplace") { onBrowse(); setMobileOpen(false); } }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            >
              {item}
            </button>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Button variant="outline" size="lg" className="w-full rounded-xl border-emerald-500/50 text-emerald-600 dark:text-emerald-400" onClick={() => { onLogin(); setMobileOpen(false); }}>Login</Button>
            <Button size="lg" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" onClick={() => { onLogin(); setMobileOpen(false); }}>Create Account</Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────── */
/*  Main Component                             */
/* ─────────────────────────────────────────── */
const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  /* Stable callbacks — must be declared before any early returns */
  const handleLogin = useCallback(() => navigate("/auth"), [navigate]);
  const handleBrowse = useCallback(() => setShowMarketplace(true), []);

  /* Intersection observer for .reveal elements */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showMarketplace, isAuthenticated]);

  /* Stats section visibility observer */
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  if (authLoading) return null;

  if (isAuthenticated || showMarketplace) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-fade-in">
        <Navbar />
        <div className="fixed bottom-4 left-4 z-50"><ThemeToggle /></div>
        <div className="container mx-auto px-4 py-6"><Marketplace /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-primary/30 selection:text-foreground">
      {/* Landing Navbar */}
      <LandingNav onBrowse={handleBrowse} onLogin={handleLogin} />
      <div className="fixed bottom-4 left-4 z-[60]"><ThemeToggle /></div>

      {/* ======================================= */}
      {/* HERO                                     */}
      {/* ======================================= */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* ── Full-bleed farm photo background ── */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=85&w=2000"
            alt="Local farm landscape showing sustainable agriculture fields"
            aria-hidden="false"
            className="w-full h-full object-cover object-center"
          />
          {/* Layered gradient: dark at top for navbar legibility, rich green-black at bottom */}
          <div className="absolute inset-0 hero-farm-overlay" />
          {/* Subtle animated colour wash on top of the photo */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[180px] animate-float pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[150px] animate-float-delayed pointer-events-none" />
        </div>

        <div className="container mx-auto px-6 lg:px-8 z-10 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy — white text on dark photo */}
            <div className="reveal">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-8 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                The Future of Agriculture is Here
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-white drop-shadow-lg">
                Direct From{" "}
                <span className="relative">
                  <span className="text-emerald-300">Nature</span>
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-300 to-lime-300 rounded-full" />
                </span>
                <br />
                To Your Doorstep
              </h1>
              <p className="text-lg text-white/75 mb-10 leading-relaxed max-w-lg">
                wakulima agri-connect connects local farmers directly with consumers through a transparent, AI-powered marketplace — freshness guaranteed, community empowered.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Button
                  size="lg"
                  id="hero-cta-primary"
                  className="h-14 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all text-base font-bold group border-0"
                  onClick={() => navigate("/auth")}
                >
                  Start Growing
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  id="hero-cta-secondary"
                  variant="outline"
                  className="h-14 px-8 rounded-full border-2 border-white/60 text-white hover:bg-white hover:text-emerald-900 backdrop-blur-md text-base font-bold group shadow-lg shadow-black/20"
                  onClick={() => setShowMarketplace(true)}
                >
                  <Play className="mr-2 h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
                  Browse Marketplace
                </Button>
              </div>

              {/* Micro-stats row — on dark bg */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 pt-6 border-t border-white/15">
                {[
                  { num: "12k+", label: "Certified Farmers" },
                  { num: "45m+", label: "Products Shared" },
                  { num: "⭐ 4.9", label: "Average Rating" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 ${i > 0 ? "sm:pl-6 sm:border-l sm:border-white/20" : ""}`}>
                    <p className="text-xl sm:text-2xl font-extrabold leading-tight text-white">{s.num}</p>
                    <p className="text-xs text-white/60 leading-tight max-w-[64px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: hero image stack */}
            <div className="relative reveal hidden lg:flex justify-center items-center" style={{ transitionDelay: "200ms" }}>
              {/* Main image */}
              <div className="relative w-[420px] h-[480px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-emerald-400/30 rounded-[40px] blur-2xl scale-95" />
                <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl h-full">
                  <img
                    src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=900"
                    alt="Fresh Farm Produce"
                    className="w-full h-full object-cover animate-float"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Floating card — top left */}
                <div className="absolute -top-6 -left-10 glass p-4 rounded-2xl shadow-2xl animate-float-delayed backdrop-blur-xl border border-white/20 max-w-[190px]">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="p-2 bg-gradient-to-br from-emerald-500 to-green-400 rounded-xl shadow-lg">
                      <Zap className="h-4 w-4 text-white" />
                    </span>
                    <span className="font-bold text-sm">Live Prices</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Real-time market price tracking for every harvest.</p>
                </div>

                {/* Floating card — bottom right */}
                <div className="absolute -bottom-4 -right-8 glass p-4 rounded-2xl shadow-2xl animate-float backdrop-blur-xl border border-white/20 max-w-[200px]">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="p-2 bg-gradient-to-br from-primary to-emerald-500 rounded-xl shadow-lg">
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </span>
                    <span className="font-bold text-sm">Verified</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Every purchase supports sustainable local farming.</p>
                </div>

                {/* Floating tag — mid right */}
                <div className="absolute top-1/2 -right-14 -translate-y-1/2 glass p-3 rounded-xl shadow-xl animate-float-delayed backdrop-blur-xl border border-white/20 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold leading-none">+38%</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Farmer income</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent to-primary" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </section>

      {/* ======================================= */}
      {/* FRESH PICKS STRIP                        */}
      {/* ======================================= */}
      <section className="py-16 overflow-hidden border-y border-border/50 bg-secondary/20 relative">
        <div className="container mx-auto px-6 mb-8 reveal">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-2">What's Harvested Now</p>
              <h2 className="text-2xl font-bold">Fresh Picks</h2>
            </div>
            <Button variant="ghost" className="group text-sm" onClick={() => setShowMarketplace(true)}>
              See all <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
        <div className="flex gap-5 px-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {featuredItems.map((item, i) => (
            <div
              key={i}
              onClick={handleBrowse}
              className={`snap-start shrink-0 w-52 rounded-3xl overflow-hidden border border-border/60 hover:border-primary/40 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 bg-gradient-to-br ${item.color} backdrop-blur-sm group`}
            >
              <div className="h-36 overflow-hidden relative">
                <img src={item.img} alt={item.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                <span className="absolute top-2 right-2 bg-white/90 text-[9px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow">
                  View
                </span>
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1 block">{item.tag}</span>
                <p className="font-bold text-sm leading-tight mb-1">{item.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.farm}</p>
                <p className="text-base font-extrabold text-primary">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================= */}
      {/* STATS                                    */}
      {/* ======================================= */}
      <section className="py-24 relative" ref={statsRef}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 reveal">
            {stats.map((stat, i) => (
              <StatCard key={i} stat={stat} started={statsVisible} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      {/* ======================================= */}
      {/* HOW IT WORKS                             */}
      {/* ======================================= */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 reveal">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">The Process</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-5">How  wakulima agri-connect Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Two simple steps to bridge the gap between farm and table.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative max-w-4xl mx-auto">
            {/* Connecting dashed line */}
            <div className="hidden lg:block absolute top-[52px] left-[35%] right-[35%] h-[2px]">
              <div className="w-full h-full border-t-2 border-dashed border-primary/30" />
              <div className="absolute left-0 top-[-4px] w-2.5 h-2.5 rounded-full bg-primary" />
              <div className="absolute right-0 top-[-4px] w-2.5 h-2.5 rounded-full bg-primary" />
            </div>

            {steps.map((item, i) => (
              <div
                key={i}
                className="reveal group relative bg-card border border-border/60 rounded-3xl p-8 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className={`w-[60px] h-[60px] rounded-2xl bg-gradient-to-br ${item.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-5xl font-black text-primary/10 absolute top-6 right-8 select-none">{item.step}</span>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================= */}
      {/* DISCOVER MORE TILE LINKS                 */}
      {/* ======================================= */}
      <section className="py-16 bg-secondary/10 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 reveal">
            {/* Mission Card */}
            <div
              onClick={() => navigate("/mission")}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 p-8 sm:p-10"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-colors duration-500" />
              <div className="relative z-10">
                <Badge className="mb-6 px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] tracking-widest uppercase">Our Core Mission</Badge>
                <h3 className="text-3xl font-extrabold mb-4 group-hover:text-emerald-600 transition-colors duration-300">Empowering a Sustainable Future</h3>
                <p className="text-muted-foreground mb-8">Discover how we are building transparent supply chains for 2M+ users and bringing fair trade to local agriculture.</p>
                <div className="flex items-center text-sm font-bold text-emerald-600">
                  Read Our Mission
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </div>

            {/* Stories Card */}
            <div
              onClick={() => navigate("/farmer-stories")}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 p-8 sm:p-10"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -ml-20 -mb-20 group-hover:bg-primary/10 transition-colors duration-500" />
              <div className="relative z-10">
                <Badge className="mb-6 px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[10px] tracking-widest uppercase">Community</Badge>
                <h3 className="text-3xl font-extrabold mb-4 group-hover:text-primary transition-colors duration-300">Stories From The Field</h3>
                <p className="text-muted-foreground mb-8">Don't just take our word for it. Hear directly from the farmers and buyers whose lives have been transformed by  wakulima agri-connect.</p>
                <div className="flex items-center text-sm font-bold text-primary">
                  Meet Our Farmers
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================= */}
      {/* CTA                                      */}
      {/* ======================================= */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="relative rounded-[48px] overflow-hidden cta-mesh-bg p-10 lg:p-20 text-center text-white reveal">
            {/* Decorative orbs inside CTA */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-36 -mt-36 blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/20 rounded-full -ml-36 -mb-36 blur-[60px] pointer-events-none" />
            <div className="absolute inset-0 cta-grid-overlay pointer-events-none opacity-10" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <Badge className="mb-8 bg-white/15 text-white border-white/20 px-4 py-1.5 text-xs tracking-widest uppercase">
                Join 2M+ users
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
                Ready to join the revolution<br />of agricultural trade?
              </h2>
              <p className="text-lg text-white/80 mb-12 max-w-xl mx-auto">
                Join thousands of farmers and buyers already growing together on  wakulima agri-connect. No fees for the first 6 months.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  id="cta-join"
                  className="h-14 px-12 rounded-full bg-white text-[#05280f] hover:bg-emerald-50 hover:scale-105 transition-all text-base font-extrabold shadow-2xl"
                  onClick={() => navigate("/auth")}
                >
                  Join Now for Free
                </Button>
                <Button
                  size="lg"
                  id="cta-browse"
                  variant="ghost"
                  className="h-14 px-10 rounded-full border-2 border-white/50 text-white hover:bg-white/20 text-base font-bold backdrop-blur-sm"
                  onClick={() => setShowMarketplace(true)}
                >
                  Browse Marketplace
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 opacity-75">
                {[
                  { icon: ShieldCheck, label: "SSL Secured" },
                  { icon: CheckCircle2, label: "No Credit Card" },
                  { icon: Globe, label: "48 Regions" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <b.icon className="h-4 w-4" />
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Stat Card sub-component                    */
/* ─────────────────────────────────────────── */
function StatCard({ stat, started, delay }: { stat: typeof stats[0]; started: boolean; delay: number }) {
  // Parse numeric target from display string  
  const rawNum = parseInt(stat.display.replace(/[^0-9]/g, ""), 10);
  const count = useCountUp(rawNum, 1800, started);
  const suffix = stat.display.replace(/[0-9]/g, "").trim(); // e.g. "k+", "%", "+"

  return (
    <div
      className="reveal flex flex-col items-center justify-center p-8 rounded-3xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <stat.icon className={`h-7 w-7 ${stat.color}`} />
      </div>
      <h3 className="text-4xl font-extrabold mb-1 tabular-nums">
        {count}{suffix}
      </h3>
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-center">{stat.label}</p>
    </div>
  );
}

export default Index;
