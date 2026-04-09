import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, CircleHelp, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createTicket } from "@/integrations/supabase/tickets";
import { useState } from "react";
import { checkRateLimit } from "@/integrations/supabase/admin";

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        setIsSubmitting(true);
        try {
            // Apply rate limiting: 3 attempts per 10 minutes per IP/User
            const canProceed = await checkRateLimit(formData.get("email") as string, "contact_submission", 600, 3);
            if (!canProceed) {
                toast.error("Too many attempts. Please try again in 10 minutes.");
                setIsSubmitting(false);
                return;
            }

            await createTicket({
                full_name: formData.get("full_name") as string,
                email: formData.get("email") as string,
                subject: formData.get("subject") as string,
                message: formData.get("message") as string,
            });
            toast.success("Message received! Our team will get back to you within 24 hours.");
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast.error("Failed to send message: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-20">
                <section className="text-center mb-20 reveal">
                    <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">Get in Touch</Badge>
                    <h1 className="text-5xl lg:text-6xl font-bold mb-8 text-gradient italic">Let's Grow Together</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Have questions about our marketplace or want to join our verified farmer network? We're here to help.
                    </p>
                </section>

                <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto mb-32">
                    <div className="reveal">
                        <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
                        <div className="space-y-8">
                            <div className="flex gap-6 items-start group">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <Mail className="h-6 w-6 transition-transform group-hover:rotate-12" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Email Us</h3>
                                    <p className="text-muted-foreground">For general inquiries and support.</p>
                                    <a href="mailto:support@wakulima.online" className="text-primary font-semibold hover:underline mt-2 block">support@wakulima.online</a>
                                </div>
                            </div>

                            <div className="flex gap-6 items-start group">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <Phone className="h-6 w-6 transition-transform group-hover:rotate-12" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Call Us</h3>
                                    <p className="text-muted-foreground">Mon-Fri from 8am to 5pm PST.</p>
                                    <p className="text-primary font-semibold mt-2">+1 (800) AGRI-LINK</p>
                                </div>
                            </div>

                            <div className="flex gap-6 items-start group">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <MapPin className="h-6 w-6 transition-transform group-hover:rotate-12" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Visit Our HQ</h3>
                                    <p className="text-muted-foreground">Agriculture & Innovation Hub.</p>
                                    <p className="text-primary font-semibold mt-2">123 Innovation Way, San Jose, CA 95110</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-8 rounded-3xl bg-secondary/10 border border-primary/5">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <CircleHelp className="h-5 w-5 text-primary" /> Support Departments
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { name: "Farmer Relations", email: "farmers@wakulima.online" },
                                    { name: "Order Support", email: "orders@wakulima.online" },
                                    { name: "Press & Media", email: "press@wakulima.online" },
                                ].map((dept, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 hover:border-primary/30 transition-colors cursor-pointer group">
                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{dept.name}</span>
                                        <span className="text-primary flex items-center font-medium">{dept.email} <ChevronRight className="h-3 w-3 ml-1" /></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="reveal" style={{ transitionDelay: "200ms" }}>
                        <div className="glass p-10 rounded-[40px] shadow-2xl relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-[40px]" />
                            <h2 className="text-2xl font-bold mb-8">Send us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input name="full_name" placeholder="John Doe" className="bg-background/50 border-border/50" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input name="email" type="email" placeholder="john@example.com" className="bg-background/50 border-border/50" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input name="subject" placeholder="How can we help?" className="bg-background/50 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea name="message" placeholder="Tell us more about your inquiry..." className="bg-background/50 border-border/50 min-h-[150px]" required />
                                </div>
                                <Button type="submit" size="lg" className="w-full h-14 rounded-full text-lg shadow-lg shadow-primary/20 group" disabled={isSubmitting}>
                                    {isSubmitting ? "Sending..." : "Send Message"} <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* FAQs Section */}
                <section className="max-w-4xl mx-auto mb-20 reveal">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Find quick answers to common questions about our platform.</p>
                    </div>
                    <Accordion type="single" collapsible className="space-y-4">
                        {[
                            {
                                q: "How do I verify my farm on Wakulima?",
                                a: "Simply sign up as a farmer and submit your business registration and harvest certifications via the dashboard. Our team will review and verify your profile within 48 hours."
                            },
                            {
                                q: "What are the shipping costs?",
                                a: "Shipping costs are calculated based on distance and volume. Since we optimize routes using AI, we often find the most cost-effective local delivery options."
                            },
                            {
                                q: "Is there a minimum order quantity?",
                                a: "Minimum order quantities are set by individual farmers based on their harvest capability and logistical constraints. These are clearly visible on each product listing."
                            },
                            {
                                q: "How does the AI Assistant help?",
                                a: "Our AI Assistant helps farmers predict harvest yields and market prices, while helping buyers find the freshest seasonal produce and optimize their procurement schedules."
                            },
                        ].map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-card/50">
                                <AccordionTrigger className="font-bold text-left hover:no-underline py-6">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            </main>
        </div>
    );
};

export default Contact;
