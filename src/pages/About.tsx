import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Award, ShieldCheck, Mail, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
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
                    <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">Our Story</Badge>
                    <h1 className="text-5xl lg:text-6xl font-bold mb-8 text-gradient italic">Cultivating Connections</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Founded in 2024, AgriLink was born from a simple observation: the gap between those who grow our food and those who eat it was getting wider. We set out to bridge that gap using modern technology.
                    </p>
                </section>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <div className="reveal">
                        <h2 className="text-3xl font-bold mb-6">A Vision for Direct Trade</h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            We believe that farmers deserve better margins and consumers deserve fresher produce. By removing unnecessary middlemen, we create a more resilient and profitable ecosystem for everyone involved.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users className="h-5 w-5" /></div>
                                <span className="font-semibold text-sm">Community Led</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><ShieldCheck className="h-5 w-5" /></div>
                                <span className="font-semibold text-sm">Trust Verified</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative reveal" style={{ transitionDelay: "200ms" }}>
                        <div className="glass-dark rounded-[40px] p-2 aspect-video overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000"
                                alt="Barn landscape"
                                className="w-full h-full object-cover rounded-[32px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Our Journey Timeline */}
                <section className="py-24 mb-24 reveal">
                    <h2 className="text-3xl font-bold text-center mb-16">Our Journey</h2>
                    <div className="max-w-4xl mx-auto relative space-y-12">
                        <div className="absolute left-[21px] md:left-1/2 top-4 bottom-4 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

                        {[
                            { year: "2024", title: "The Seed", desc: "AgriLink founded in San Jose with a mission to digitize the local harvest." },
                            { year: "2025", title: "Market Growth", desc: "Expansion to 500+ verified farms across three states." },
                            { year: "2026", title: "Global Vision", desc: "Onboarding 2M+ users and launching AI-driven logistics optimization." },
                        ].map((milestone, i) => (
                            <div key={i} className={`flex flex-col md:flex-row gap-8 items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left px-4">
                                    <Badge variant="outline" className="mb-2 text-primary border-primary/20">{milestone.year}</Badge>
                                    <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                                    <p className="text-muted-foreground text-sm">{milestone.desc}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary border-4 border-background z-10 hidden md:block shadow-lg" />
                                <div className="md:w-1/2 hidden md:block" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20 mb-20 bg-secondary/10 rounded-[40px] px-12 reveal">
                    <h2 className="text-3xl font-bold text-center mb-16">Meet Our Leadership</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                name: "Marcus Thorne",
                                role: "CEO & Co-Founder",
                                bio: "20+ years in ag-tech and sustainable supply chain management.",
                                img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"
                            },
                            {
                                name: "Elena Vance",
                                role: "Director of Sustainability",
                                bio: "Specialist in regenerative agriculture and carbon-neutral logistics.",
                                img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop"
                            },
                            {
                                name: "David Park",
                                role: "CTO",
                                bio: "Led engineering for global distribution platforms focusing on AI/ML.",
                                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"
                            },
                        ].map((member, i) => (
                            <div key={i} className="text-center group reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                                <div className="relative w-32 h-32 mx-auto mb-6 group-hover:scale-105 transition-transform">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img src={member.img} alt={member.name} className="w-full h-full object-cover rounded-full border-4 border-background shadow-lg relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                                <p className="text-primary text-sm font-semibold mb-3">{member.role}</p>
                                <p className="text-muted-foreground text-sm mb-6 max-w-[250px] mx-auto">{member.bio}</p>
                                <div className="flex justify-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Twitter className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Linkedin className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Mail className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-20 reveal">
                    <h2 className="text-3xl font-bold text-center mb-16">Our Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { icon: Target, title: "Precision", desc: "Using AI to optimize supply chains and minimize waste." },
                            { icon: Award, title: "Quality", desc: "Rigorous verification for every farmer in our network." },
                            { icon: ShieldCheck, title: "Integrity", desc: "Transparent pricing and direct payment terms." },
                        ].map((value, i) => (
                            <div key={i} className="text-center group">
                                <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform shadow-sm bg-secondary/50">
                                    <value.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                <p className="text-muted-foreground text-sm">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default About;
