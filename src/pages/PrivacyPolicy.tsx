import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
                        <p className="text-center text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[70vh] pr-4">
                            <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">1. Introduction</h3>
                                    <p>
                                        Welcome to AgriLink ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                                        If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please
                                        contact us at support@agrilink.global.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">2. Information We Collect</h3>
                                    <p className="mb-2">We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Personal Information:</strong> Name, email address, username, password, and contact preferences.</li>
                                        <li><strong>Profile Information:</strong> Biography, location, avatar images, and verification documents.</li>
                                        <li><strong>Transaction Data:</strong> Delivery details, order history, and payment method information (processed securely by third-party providers).</li>
                                        <li><strong>Usage Data:</strong> We automatically collect certain information when you visit, use, or navigate the Website. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and information about how and when you use our Website.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">3. How We Use Your Information</h3>
                                    <p className="mb-2">We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>To facilitate account creation and logon process.</li>
                                        <li>To fulfill and manage your orders and payments.</li>
                                        <li>To enable user-to-user communications (messaging between Farmers and Buyers).</li>
                                        <li>To request feedback and contact you about your use of our Website.</li>
                                        <li>To protect our Services (fraud monitoring and prevention).</li>
                                        <li>To deliver targeted advertising (via Meta Pixel and other tools) to you.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">4. Sharing Your Information</h3>
                                    <p className="mb-2">We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Other Users:</strong> When you share personal information (for example, by posting comments, contributions, or other content to the Website) or interact with other users (e.g., messaging), such information may be viewed by all users and may be publicly distributed outside the Website in perpetuity.</li>
                                        <li><strong>Service Providers:</strong> We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work (e.g., payment processing, email delivery, hosting services).</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">5. Cookies and Tracking Technologies</h3>
                                    <p>
                                        We may use cookies and similar tracking technologies (like web beacons and pixels, including the Meta Pixel) to access or store information.
                                        Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">6. Your Privacy Rights</h3>
                                    <p>
                                        In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information. To make such a request, please contact us.
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">7. Contact Us</h3>
                                    <p>
                                        If you have questions or comments about this policy, you may email us at support@agrilink.global or by post to:
                                    </p>
                                    <address className="mt-2 not-italic">
                                        AgriLink Global Inc.<br />
                                        123 Innovation Way<br />
                                        San Jose, CA 95110<br />
                                        United States
                                    </address>
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

export default PrivacyPolicy;
