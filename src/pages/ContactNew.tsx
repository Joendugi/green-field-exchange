import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageSquare,
  Users,
  HelpCircle,
  Globe
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6 text-green-600" />,
      title: "Address",
      details: "123 Innovation Way\nSan Jose, CA 95110\nUnited States"
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Email",
      details: "support@wakulima.online\npartnerships@wakulima.online\npress@wakulima.online"
    },
    {
      icon: <Phone className="w-6 h-6 text-purple-600" />,
      title: "Phone",
      details: "1-800-AGRI-LINK\nMon-Fri: 8AM-6PM PST\nSat-Sun: 9AM-4PM PST"
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      title: "Response Time",
      details: "General Inquiries: 24hrs\nSupport Tickets: 2hrs\nPartnerships: 48hrs"
    }
  ];

  const contactTypes = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "partnership", label: "Partnership Opportunity" },
    { value: "farmer", label: "Farmer Support" },
    { value: "buyer", label: "Buyer Support" },
    { value: "press", label: "Media Inquiry" }
  ];

  const faqCategories = [
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "For Farmers",
      questions: [
        "How do I start selling on Wakulima?",
        "What are the verification requirements?",
        "How does pricing work?",
        "What are the seller fees?"
      ]
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: "For Buyers",
      questions: [
        "How do I know products are fresh?",
        "What payment methods are accepted?",
        "How does delivery work?",
        "Can I track my order?"
      ]
    },
    {
      icon: <HelpCircle className="w-8 h-8 text-purple-600" />,
      title: "General",
      questions: [
        "Is Wakulima available in my area?",
        "How do you verify sellers?",
        "What is your refund policy?",
        "How do I report an issue?"
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: "", email: "", subject: "", message: "", type: "general" });
      alert("Thank you for your message! We'll respond within 24 hours.");
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Contact Wakulima
            </h1>
            <p className="text-xl mb-8 text-green-100">
              We're here to help. Reach out to our team for support, partnerships, or just to say hello.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {info.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{info.title}</h3>
                  <p className="text-gray-600 whitespace-pre-line text-sm">
                    {info.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Send us a Message</h2>
              <Card>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Inquiry Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full p-3 border rounded-lg"
                      >
                        {contactTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Your Name</label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="How can we help you?"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Send Message
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqCategories.map((category, index) => (
                  <Card key={index} className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        {category.icon}
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {category.questions.map((question, qIndex) => (
                          <div key={qIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <span className="text-sm">{question}</span>
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Other Ways to Connect</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Live Chat</h3>
                <p className="text-gray-600 mb-4">
                  Chat with our support team in real-time for immediate assistance.
                </p>
                <Button className="w-full">Start Chat</Button>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community Forum</h3>
                <p className="text-gray-600 mb-4">
                  Connect with other farmers and buyers in our active community.
                </p>
                <Button variant="outline" className="w-full">Join Forum</Button>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Help Center</h3>
                <p className="text-gray-600 mb-4">
                  Browse our comprehensive guides and documentation.
                </p>
                <Button variant="outline" className="w-full">Visit Help Center</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Offices</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Headquarters</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Address:</strong> 123 Innovation Way, San Jose, CA 95110</p>
                  <p><strong>Phone:</strong> 1-800-AGRI-LINK</p>
                  <p><strong>Email:</strong> support@wakulima.online</p>
                  <p><strong>Hours:</strong> Mon-Fri 8AM-6PM PST</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Regional Office</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Address:</strong> 456 Market Street, San Francisco, CA 94105</p>
                  <p><strong>Phone:</strong> 1-415-AGRI-SF</p>
                  <p><strong>Email:</strong> sf@wakulima.online</p>
                  <p><strong>Hours:</strong> Mon-Fri 9AM-5PM PST</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
