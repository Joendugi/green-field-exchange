import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { CircleCheckBig, Leaf, TrendingUp, Zap, Globe, Heart, Shield } from "lucide-react";

const Mission = () => {
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
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-20">
                <section className="text-center mb-20 reveal">
                    <Badge className="mb-6 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">Our Mission</Badge>
                    <h1 className="text-5xl lg:text-6xl font-bold mb-8 text-gradient italic">Growing a Better Future</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Our mission is to empower 2 million farmers worldwide by providing them with the tools, market access, and data they need to thrive in a digital economy.
                    </p>
                </section>

                {/* Impact Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-24 reveal">
                    {[
                        { label: "Farmers Empowered", value: "2M+", sub: "Target by 2030", icon: Heart },
                        { label: "Waste Reduction", value: "40%", sub: "Through AI Logistics", icon: Leaf },
                        { label: "Fair Trade Value", value: "$4.5B", sub: "Annual Market Impact", icon: TrendingUp },
                        { label: "Global Reach", value: "125", sub: "Countries & Regions", icon: Globe },
                    ].map((metric, i) => (
                        <div key={i} className="p-8 rounded-[32px] glass text-center group hover:bg-primary/5 transition-colors">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                                <metric.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{metric.value}</h3>
                            <p className="font-semibold text-sm mb-1">{metric.label}</p>
                            <p className="text-xs text-muted-foreground">{metric.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-12 mb-24">
                    {[
                        {
                            icon: Leaf,
                            title: "Sustainability",
                            desc: "Promoting regenerative farming practices that heal the earth while feeding the community.",
                            color: "text-emerald-500"
                        },
                        {
                            icon: TrendingUp,
                            title: "Prosperity",
                            desc: "Ensuring fair market value for every harvest, increasing farmer income by an average of 40%.",
                            color: "text-primary"
                        },
                        {
                            icon: Zap,
                            title: "Efficiency",
                            desc: "Reducing the time from harvest to table, ensuring maximum nutrient density and minimal spoilage.",
                            color: "text-amber-500"
                        }
                    ].map((item, i) => (
                        <div key={i} className="p-8 rounded-[32px] bg-secondary/20 border border-primary/5 hover:border-primary/20 transition-all reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                            <item.icon className={`h-12 w-12 mb-6 ${item.color}`} />
                            <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Partners Section */}
                <section className="mb-24 reveal">
                    <h2 className="text-3xl font-bold text-center mb-16">Trust & Partnerships</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        {[1, 2, 3, 4].map((p) => (
                            <div key={p} className="h-20 flex items-center justify-center border border-dashed border-border rounded-xl font-bold text-muted-foreground/30 text-xl tracking-widest uppercase italic">
                                PARTNER {p}
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-8">Collaborating with the world's leading agricultural and environmental organizations.</p>
                </section>

                <section className="max-w-4xl mx-auto reveal mb-20">
                    <h2 className="text-3xl font-bold mb-12 text-center">Our Commitment to Transparency</h2>
                    <div className="space-y-6">
                        {[
                            "Real-time price tracking for all agricultural commodities.",
                            "Verified farmer profiles including certifications and farming methods.",
                            "Direct communication channels between buyers and sellers.",
                            "AI-driven market insights accessible to all community members."
                        ].map((text, i) => (
                            <div key={i} className="flex gap-4 p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <CircleCheckBig className="h-6 w-6 text-primary shrink-0" />
                                <p className="font-medium text-foreground/90">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Mission;
