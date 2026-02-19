import { useEffect, useState, useRef } from "react";
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
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Marketplace from "@/components/Marketplace";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showMarketplace, setShowMarketplace] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [showMarketplace, isAuthenticated]);

  if (authLoading) return null;

  if (isAuthenticated || showMarketplace) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-fade-in">
        <Navbar />
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-6">
          <Marketplace />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-primary selection:text-white">
      <div className="fixed top-4 right-4 z-[60]">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-400/20 rounded-full blur-[100px] animate-float-delayed" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=2070')] opacity-[0.03] bg-cover bg-center" />
        </div>

        <div className="container mx-auto px-4 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                🌱 The Future of Agriculture is Here
              </Badge>
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Direct From <span className="text-gradient">Nature</span> To Your Doorstep
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                AgriLink connects local farmers directly with consumers through a transparent, AI-powered marketplace. Freshness guaranteed, community empowered.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Button size="lg" className="h-14 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-lg group" onClick={() => navigate("/auth")}>
                  Start Growing <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 rounded-full border-2 hover:bg-secondary/50 text-lg"
                  onClick={() => setShowMarketplace(true)}
                >
                  Browse Marketplace
                </Button>
              </div>
              <div className="flex items-center gap-8 border-t pt-8 border-border">
                <div>
                  <p className="text-3xl font-bold">12k+</p>
                  <p className="text-sm text-muted-foreground">Certified Farmers</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-3xl font-bold">45m+</p>
                  <p className="text-sm text-muted-foreground">Products Shared</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="rotate-[-1deg] text-primary">⭐ 4.9 Rating</p>
                </div>
              </div>
            </div>

            <div className="relative reveal hidden lg:block" style={{ transitionDelay: "200ms" }}>
              <div className="glass-dark rounded-[40px] p-2 aspect-square overflow-hidden shadow-2xl relative z-10 animate-float">
                <img
                  src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=1000"
                  alt="Modern Farm"
                  className="w-full h-full object-cover rounded-[32px]"
                />
              </div>
              {/* Floating Glass Cards */}
              <div className="absolute top-10 -left-10 glass p-5 rounded-2xl z-20 animate-float-delayed shadow-xl max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold">Real-time</span>
                </div>
                <p className="text-xs text-muted-foreground">Live market price tracking for your harvest.</p>
              </div>
              <div className="absolute bottom-10 -right-5 glass p-5 rounded-2xl z-20 animate-float shadow-xl max-w-[220px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold">Verified</span>
                </div>
                <p className="text-xs text-muted-foreground">Every purchase supports sustainable local farming.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-secondary/30 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 reveal">
            {[
              { label: "Active Users", value: "250k+", icon: Users },
              { label: "Daily Orders", value: "8.5k+", icon: ShoppingCart },
              { label: "Regions covered", value: "48+", icon: Globe },
              { label: "Growth YoY", value: "142%", icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-3xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-4xl font-extrabold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 text-center mb-16 reveal">
          <h2 className="text-4xl font-bold mb-4">How AgriLink Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to bridge the gap between farm and table.</p>
        </div>
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-[25%] left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-border z-0" />

          {[
            {
              step: "01",
              title: "Farmers Post Harvest",
              desc: "Farmers list their fresh produce directly on our live marketplace with transparent pricing.",
              icon: Leaf
            },
            {
              step: "02",
              title: "Buyers Order Direct",
              desc: "Buyers browse local listings, compare prices, and place orders directly with the source.",
              icon: ShoppingCart
            },
            {
              step: "03",
              title: "Smart Delivery",
              desc: "Our AI-optimized logistics ensure the shortest route from farm to gate for maximum freshness.",
              icon: Zap
            },
          ].map((item, i) => (
            <div key={i} className="relative z-10 group reveal text-center lg:text-left" style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 mx-auto lg:mx-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 hover:rotate-6">
                <item.icon className="h-10 w-10" />
              </div>
              <span className="text-primary font-bold mb-4 block text-lg">{item.step}</span>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center reveal">
            <Badge className="mb-6 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">Our Core Mission</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 italic leading-tight">
              “Empowering farmers, creating direct connections, and building a sustainable agricultural future for 2M+ users.”
            </h2>
            <div className="grid md:grid-cols-2 gap-12 text-left mt-16">
              <div className="reveal" style={{ transitionDelay: "100ms" }}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-primary">
                  <ShieldCheck className="h-6 w-6" /> Transparency
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in a marketplace where every transaction is visible and fair. No hidden middlemen, just direct trade between those who grow and those who consume.
                </p>
              </div>
              <div className="reveal" style={{ transitionDelay: "200ms" }}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-primary">
                  <Leaf className="h-6 w-6" /> Sustainability
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  By optimizing logistics with AI and shortening supply chains, we reduce carbon footprints and ensure minimal waste from farm to table.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-secondary/10 overflow-hidden">
        <div className="container mx-auto px-4 mb-16 reveal">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-4">Stories From The Field</h2>
              <p className="text-muted-foreground">Don't just take our word for it. Hear from our thriving community.</p>
            </div>
            <Button variant="ghost" className="group">View all success stories <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button>
          </div>
        </div>
        <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Jenkins",
              role: "Organic Farmer, Green Valley",
              quote: "Since joining AgriLink, my waste has dropped by 40% and my profits have increased significantly. It's a game changer for small farms.",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
            },
            {
              name: "David Chen",
              role: "Head Chef, Artisan Kitchen",
              quote: "The quality of produce I get through AgriLink is unmatched. Knowing exactly which farm my ingredients come from is essential for my kitchen.",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
            },
            {
              name: "Elena Rodriguez",
              role: "Co-op Lead, Sunny Hills",
              quote: "The AI assistant provides market insights we never had access to before. We can now price our harvests competitively and fairly.",
              avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
            }
          ].map((t, i) => (
            <Card key={i} className="reveal card-premium p-8" style={{ transitionDelay: `${i * 100}ms` }}>
              <CardContent className="p-0">
                <div className="flex gap-1 mb-6 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="text-lg italic mb-8 relative z-10 leading-relaxed text-foreground/90">"{t.quote}"</p>
                <div className="flex items-center gap-4 border-t pt-6">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
                    <img src={t.avatar} alt={t.name} />
                  </div>
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass-dark rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden bg-primary/95 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full -ml-32 -mb-32 blur-[80px]" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to join the revolution of agricultural trade?</h2>
              <p className="text-xl text-primary-foreground/90 mb-10">Join thousands of farmers and buyers already growing together on AgriLink.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" className="h-14 px-10 rounded-full text-lg font-bold hover:scale-105 transition-transform" onClick={() => navigate("/auth")}>
                  Join Now for Free
                </Button>
                <Button size="lg" variant="ghost" className="h-14 px-10 rounded-full text-lg border border-white/20 hover:bg-white/10" onClick={() => navigate("/auth")}>
                  Talk to our Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Index;

