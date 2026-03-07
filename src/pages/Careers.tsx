import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Users, 
  MapPin, 
  DollarSign,
  Clock,
  Heart,
  Target,
  Award,
  TrendingUp,
  Globe,
  Lightbulb,
  Shield
} from "lucide-react";

const Careers = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const openings = [
    {
      id: 1,
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Jose, CA",
      type: "Full-time",
      experience: "Senior",
      salary: "$150k - $200k",
      description: "Build scalable platform connecting farmers with buyers globally. Experience with React, Node.js, and cloud infrastructure required.",
      requirements: [
        "5+ years of full-stack development experience",
        "Expertise in React, TypeScript, and Node.js",
        "Experience with cloud platforms (AWS, GCP, Azure)",
        "Passion for sustainable agriculture"
      ],
      benefits: ["Equity", "Health insurance", "Flexible work", "Impact bonus"],
      postedDate: "2024-01-15",
      featured: true
    },
    {
      id: 2,
      title: "Product Manager",
      department: "Product",
      location: "San Francisco, CA",
      type: "Full-time",
      experience: "Mid",
      salary: "$120k - $160k",
      description: "Lead product strategy for our farmer and buyer platforms. Drive user research, feature development, and market expansion.",
      requirements: [
        "3+ years of product management experience",
        "Experience with B2B or marketplace platforms",
        "Strong analytical and communication skills",
        "Understanding of agricultural industry preferred"
      ],
      benefits: ["Equity", "Health insurance", "Remote options", "Learning budget"],
      postedDate: "2024-01-12",
      featured: true
    },
    {
      id: 3,
      title: "Farmer Success Manager",
      department: "Operations",
      location: "Remote",
      type: "Full-time",
      experience: "Mid",
      salary: "$80k - $100k",
      description: "Support farmers in maximizing their success on Wakulima. Provide training, resolve issues, and gather feedback.",
      requirements: [
        "2+ years of customer success experience",
        "Background in agriculture or farming",
        "Excellent communication and problem-solving skills",
        "Fluency in Spanish preferred"
      ],
      benefits: ["Health insurance", "Remote work", "Travel opportunities", "Performance bonus"],
      postedDate: "2024-01-10",
      featured: false
    }
  ];

  const categories = [
    { id: "all", label: "All Positions" },
    { id: "engineering", label: "Engineering" },
    { id: "product", label: "Product" },
    { id: "operations", label: "Operations" },
    { id: "marketing", label: "Marketing" }
  ];

  const companyValues = [
    {
      icon: <Heart className="w-12 h-12 text-green-600" />,
      title: "Mission-Driven",
      description: "Join a team that's making a real difference in sustainable agriculture and food security."
    },
    {
      icon: <Users className="w-12 h-12 text-blue-600" />,
      title: "Collaborative Culture",
      description: "Work with passionate people who support each other and share knowledge freely."
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-purple-600" />,
      title: "Growth Opportunities",
      description: "Develop your skills and advance your career in a fast-growing, impactful company."
    },
    {
      icon: <Shield className="w-12 h-12 text-orange-600" />,
      title: "Work-Life Balance",
      description: "Flexible schedules, remote options, and benefits that support your well-being."
    }
  ];

  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8 text-green-600" />,
      title: "Competitive Compensation",
      description: "Market salaries, equity packages, and performance bonuses"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, vision, and mental health coverage"
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Flexible Work",
      description: "Remote options, flexible hours, and generous PTO policy"
    },
    {
      icon: <Target className="w-8 h-8 text-purple-600" />,
      title: "Professional Growth",
      description: "Learning budget, conference attendance, and career development"
    }
  ];

  const filteredOpenings = selectedCategory === "all" 
    ? openings 
    : openings.filter(job => job.department.toLowerCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Careers at Wakulima
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Join us in building the future of sustainable agriculture and connecting farmers with the world.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                View Open Positions
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Learn About Our Culture
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Company Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Work at Wakulima?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => (
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

      {/* Job Filter */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Open Positions</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredOpenings.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">{job.department}</Badge>
                        <Badge variant="outline">{job.type}</Badge>
                        {job.featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{job.salary}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>{job.experience}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600">{job.description}</p>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="font-semibold mb-2">Benefits</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="flex gap-3">
                    <Button className="flex-1">
                      Apply Now
                    </Button>
                    <Button variant="outline">
                      Save Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOpenings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                No positions found in {selectedCategory}. Check other categories or sign up for job alerts.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Total Rewards</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Even if we don't have the perfect role open right now, we'd love to hear from you. 
            We're always looking for talented people who share our passion for sustainable agriculture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Submit Your Resume
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Join Talent Community
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
