import { Sprout, Globe, Mail, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Footer = () => (
    <footer className="bg-card border-t pt-20 pb-10">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <Sprout className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold uppercase tracking-tighter"> wakulima agri-connect</span>
                    </div>
                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                        Bridging the gap between farmers and consumers through technology, transparency, and sustainable trade.
                    </p>
                    <div className="space-y-4 mb-8 text-sm">
                        <p className="flex items-center gap-3 text-muted-foreground">
                            <Globe className="h-5 w-5 text-primary/60 shrink-0" />
                            <span>123 Innovation Way, San Jose, CA 95110</span>
                        </p>
                        <p className="flex items-center gap-3 text-muted-foreground">
                            <Mail className="h-5 w-5 text-primary/60 shrink-0" />
                            <span>support@ wakulima agri-connect.online</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary"><Facebook className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary"><Twitter className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary"><Instagram className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary"><Linkedin className="h-5 w-5" /></Button>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-6 uppercase text-xs tracking-[0.2em]">Platform</h4>
                    <ul className="space-y-4 text-sm">
                        <li><Link to="/#marketplace" className="text-muted-foreground hover:text-primary transition-colors">Marketplace</Link></li>
                        <li><Link to="/farmer-stories" className="text-muted-foreground hover:text-primary transition-colors">Farmer Stories</Link></li>
                        <li><Link to="/ai-insights" className="text-muted-foreground hover:text-primary transition-colors">AI Insights</Link></li>
                        <li><Link to="/global-trade" className="text-muted-foreground hover:text-primary transition-colors">Global Trade</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 uppercase text-xs tracking-[0.2em]">Company</h4>
                    <ul className="space-y-4 text-sm">
                        <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link to="/mission" className="text-muted-foreground hover:text-primary transition-colors">Mission & Vision</Link></li>
                        <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                        <li><Link to="/careers" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 uppercase text-xs tracking-[0.2em]">Newsletter</h4>
                    <p className="text-sm text-muted-foreground mb-4">Stay updated with latest harvests and insights.</p>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full bg-secondary/50 border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <Button size="sm">Join</Button>
                    </div>
                </div>
            </div>

            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <p>© 2026  wakulima agri-connect Global Inc. All rights reserved.</p>
                <div className="flex gap-8">
                    <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                    <Link to="#" className="hover:text-primary transition-colors">Cookie Policy</Link>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
