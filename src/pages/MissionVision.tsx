import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Eye, 
  Heart, 
  Globe, 
  Users,
  Leaf,
  Award,
  TrendingUp,
  Shield,
  Lightbulb
} from "lucide-react";

const MissionVision = () => {
  const mission = {
    title: "Our Mission",
    description: "To create a sustainable agricultural ecosystem where farmers thrive and communities flourish through direct connections, fair trade, and technological innovation.",
    pillars: [
      {
        icon: <Users className="w-8 h-8 text-green-600" />,
        title: "Empower Farmers",
        description: "Provide farmers with tools, markets, and fair prices to ensure sustainable livelihoods."
      },
      {
        icon: <Heart className="w-8 h-8 text-red-600" />,
        title: "Feed Communities",
        description: "Connect families with fresh, healthy, locally-sourced food while reducing food waste."
      },
      {
        icon: <Leaf className="w-8 h-8 text-green-600" />,
        title: "Protect Environment",
        description: "Promote sustainable farming practices that preserve our planet for future generations."
      }
    ]
  };

  const vision = {
    title: "Our Vision",
    description: "A world where every farmer has direct access to global markets, and every consumer knows exactly where their food comes from.",
    goals: [
      {
        icon: <Globe className="w-8 h-8 text-blue-600" />,
        title: "Global Network",
        description: "Build the world's largest trusted network of farmers and buyers."
      },
      {
        icon: <Shield className="w-8 h-8 text-purple-600" />,
        title: "Complete Transparency",
        description: "Make every aspect of the food supply chain visible and verifiable."
      },
      {
        icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
        title: "Economic Impact",
        description: "Create $10B in additional income for small farmers by 2030."
      }
    ]
  };

  const impact = [
    {
      metric: "50,000+",
      label: "Farmers Empowered",
      description: "Direct access to markets and fair pricing"
    },
    {
      metric: "1M+",
      label: "Families Fed",
      description: "Access to fresh, healthy, local food"
    },
    {
      metric: "40%",
      label: "Income Increase",
      description: "Average farmer income growth"
    },
    {
      metric: "25",
      label: "Countries",
      description: "Global agricultural network"
    }
  ];

  const commitments = [
    {
      icon: <Shield className="w-12 h-12 text-green-600" />,
      title: "Quality Assurance",
      description: "Every product is verified and meets our strict quality standards."
    },
    {
      icon: <Award className="w-12 h-12 text-blue-600" />,
      title: "Fair Pricing",
      description: "Farmers receive at least 70% of the final sale price."
    },
    {
      icon: <Leaf className="w-12 h-12 text-green-600" />,
      title: "Sustainability",
      description: "We only support farming practices that protect our environment."
    },
    {
      icon: <Users className="w-12 h-12 text-purple-600" />,
      title: "Community Focus",
      description: "Strengthening local food systems and rural economies."
    },
    {
      icon: <Lightbulb className="w-12 h-12 text-orange-600" />,
      title: "Innovation",
      description: "Continuously improving technology to serve farmers better."
    },
    {
      icon: <Eye className="w-12 h-12 text-red-600" />,
      title: "Transparency",
      description: "Full visibility from farm to table for all stakeholders."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Mission & Vision
            </h1>
            <p className="text-xl mb-8 text-green-100 max-w-3xl mx-auto">
              Building a sustainable future for agriculture through technology, transparency, and human connections.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Join Our Movement
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Download Impact Report
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">{mission.title}</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {mission.description}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {mission.pillars.map((pillar, index) => (
                <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-6">
                      {pillar.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{pillar.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">{vision.title}</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {vision.description}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {vision.goals.map((goal, index) => (
                <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-6">
                      {goal.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{goal.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{goal.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Our Impact</h2>
            <p className="text-xl text-gray-600">
              Real numbers showing the difference we're making together
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impact.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-4">{stat.metric}</div>
                <div className="text-xl font-semibold mb-2">{stat.label}</div>
                <p className="text-gray-600">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Our Commitments</h2>
            <p className="text-xl text-gray-600">
              Promises we make to our farmers, buyers, and communities
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {commitments.map((commitment, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {commitment.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">{commitment.title}</h3>
                      <p className="text-gray-600">{commitment.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Be Part of the Solution
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-3xl mx-auto">
            Whether you're a farmer looking for fair markets or a consumer seeking fresh, 
            locally-sourced food, AgriLink is your platform for meaningful connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              Start as Farmer
            </Button>
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              Start as Buyer
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionVision;
