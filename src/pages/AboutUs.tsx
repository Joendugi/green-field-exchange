import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Globe, 
  Heart, 
  Award, 
  Target,
  TrendingUp,
  Shield,
  Truck,
  Leaf
} from "lucide-react";

const AboutUs = () => {
  const stats = [
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      value: "50,000+",
      label: "Active Farmers"
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      value: "25+",
      label: "Countries Served"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      value: "$2.4B",
      label: "Annual Trade Volume"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      value: "1M+",
      label: "Families Fed"
    }
  ];

  const values = [
    {
      icon: <Shield className="w-12 h-12 text-green-600" />,
      title: "Trust & Transparency",
      description: "Every transaction is verified and transparent. Farmers get fair prices, buyers get quality products."
    },
    {
      icon: <Leaf className="w-12 h-12 text-green-600" />,
      title: "Sustainability",
      description: "We promote sustainable farming practices that protect our environment for future generations."
    },
    {
      icon: <Users className="w-12 h-12 text-blue-600" />,
      title: "Community First",
      description: "Building strong connections between farmers and consumers to strengthen local food systems."
    },
    {
      icon: <Target className="w-12 h-12 text-purple-600" />,
      title: "Innovation",
      description: "Using technology to solve real-world agricultural challenges and create new opportunities."
    }
  ];

  const team = [
    {
      name: "Sarah Martinez",
      role: "CEO & Co-Founder",
      bio: "Third-generation farmer turned tech entrepreneur. Passionate about sustainable agriculture and fair trade.",
      image: "/team/sarah.jpg"
    },
    {
      name: "David Chen",
      role: "CTO & Co-Founder",
      bio: "Former Google engineer focused on building technology that empowers rural communities.",
      image: "/team/david.jpg"
    },
    {
      name: "Maria Rodriguez",
      role: "Head of Farmer Relations",
      bio: "Agricultural economist with 15+ years helping small farms succeed in global markets.",
      image: "/team/maria.jpg"
    },
    {
      name: "James Thompson",
      role: "Head of Operations",
      bio: "Supply chain expert ensuring fresh, quality produce reaches our customers efficiently.",
      image: "/team/james.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              About Wakulima
            </h1>
            <p className="text-xl mb-8 text-green-100 max-w-3xl mx-auto">
              Bridging the gap between farmers and consumers through technology, transparency, and sustainable trade.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Join Our Mission
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Watch Our Story
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Our Mission</h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              At Wakulima, we believe that every farmer deserves fair compensation for their hard work, 
              and every family deserves access to fresh, healthy, locally-sourced food. 
              We're building technology that eliminates middlemen, reduces waste, and creates 
              direct connections between the people who grow our food and the people who eat it.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-4">40%</div>
                <p className="text-gray-600">
                  Higher income for farmers through direct sales
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-4">50%</div>
                <p className="text-gray-600">
                  Reduction in food miles and carbon footprint
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-4">24hrs</div>
                <p className="text-gray-600">
                  From harvest to doorstep for maximum freshness
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-green-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-lg font-semibold mb-2">Address</div>
              <p className="text-green-100">
                123 Innovation Way<br />
                San Jose, CA 95110
              </p>
            </div>
            <div>
              <div className="text-lg font-semibold mb-2">Email</div>
              <p className="text-green-100">
                support@wakulima.online
              </p>
            </div>
            <div>
              <div className="text-lg font-semibold mb-2">Phone</div>
              <p className="text-green-100">
                1-800-AGRI-LINK
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
