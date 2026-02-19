import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[70vh] pr-4">
                            <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">1. Agreement to Terms</h3>
                                    <p>
                                        By accessing or using the AgriLink website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">2. User Accounts</h3>
                                    <p>
                                        When you create an account with us, you safeguard your password and you agree that you are 18 years of age or older. You are responsible for all activities that occur under your account.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">3. User Content</h3>
                                    <p>
                                        Our Service allows you to post content (e.g., harvest listings, messages). You are responsible for the content that you post to the Service, including its legality, reliability, and appropriateness.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">4. Marketplace Transactions</h3>
                                    <p>
                                        AgriLink facilitates connections between buyers and farmers. We are not a party to the actual transaction between buyers and sellers. We do not guarantee the quality, safety, or legality of items advertised.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">5. Termination</h3>
                                    <p>
                                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">6. Changes to Terms</h3>
                                    <p>
                                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">7. Contact Us</h3>
                                    <p>
                                        If you have any questions about these Terms, please contact us at support@agrilink.global.
                                    </p>
                                </section>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </div>
    );
};

export default TermsOfService;
