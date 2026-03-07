import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Ship, 
  Package, 
  TrendingUp, 
  MapPin, 
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Filter
} from "lucide-react";

const GlobalTrade = () => {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const tradeOpportunities = [
    {
      id: 1,
      title: "Premium Organic Avocados",
      exporter: "Green Valley Farms, Mexico",
      importer: "Fresh Foods Inc., USA",
      product: "Avocados",
      quantity: "50,000 kg",
      price: "$4.20/kg",
      origin: "Michoacán, Mexico",
      destination: "Los Angeles, CA",
      status: "available",
      certification: "USDA Organic",
      postedDate: "2024-01-15",
      deadline: "2024-02-15",
      confidence: 94,
      trend: "high_demand"
    },
    {
      id: 2,
      title: "Premium Coffee Beans",
      exporter: "Mountain Harvest, Colombia",
      importer: "Artisan Roasters, USA",
      product: "Coffee Beans",
      quantity: "10,000 kg",
      price: "$12.50/kg",
      origin: "Antioquia, Colombia",
      destination: "Seattle, WA",
      status: "negotiating",
      certification: "Fair Trade",
      postedDate: "2024-01-12",
      deadline: "2024-02-01",
      confidence: 88,
      trend: "stable"
    },
    {
      id: 3,
      title: "Organic Quinoa",
      exporter: "Andean Grains, Peru",
      importer: "Health Foods Co., USA",
      product: "Quinoa",
      quantity: "25,000 kg",
      price: "$3.80/kg",
      origin: "Puno, Peru",
      destination: "New York, NY",
      status: "available",
      certification: "USDA Organic",
      postedDate: "2024-01-10",
      deadline: "2024-02-20",
      confidence: 91,
      trend: "increasing"
    }
  ];

  const regions = [
    { id: "all", label: "All Regions" },
    { id: "north_america", label: "North America" },
    { id: "south_america", label: "South America" },
    { id: "asia", label: "Asia" },
    { id: "europe", label: "Europe" },
    { id: "africa", label: "Africa" }
  ];

  const categories = [
    { id: "all", label: "All Products" },
    { id: "fruits", label: "Fruits" },
    { id: "vegetables", label: "Vegetables" },
    { id: "grains", label: "Grains" },
    { id: "coffee", label: "Coffee & Tea" },
    { id: "spices", label: "Spices" }
  ];

  const marketInsights = [
    {
      title: "Cross-Border Trade Volume",
      value: "$2.4B",
      change: "+18%",
      description: "Increase in agricultural trade across borders",
      icon: <Globe className="w-6 h-6 text-green-600" />
    },
    {
      title: "Active Trade Routes",
      value: "1,247",
      change: "+12%",
      description: "New international shipping routes established",
      icon: <Ship className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Verified Exporters",
      value: "8,392",
      change: "+25%",
      description: "Certified international suppliers",
      icon: <CheckCircle className="w-6 h-6 text-purple-600" />
    },
    {
      title: "Average Transaction",
      value: "$45,000",
      change: "+8%",
      description: "Typical international deal size",
      icon: <DollarSign className="w-6 h-6 text-orange-600" />
    }
  ];

  const filteredOpportunities = tradeOpportunities.filter(opportunity => {
    const regionMatch = selectedRegion === "all" || 
      (selectedRegion === "north_america" && opportunity.destination.includes("USA")) ||
      (selectedRegion === "south_america" && (opportunity.origin.includes("Mexico") || opportunity.origin.includes("Peru") || opportunity.origin.includes("Colombia")));
    
    const categoryMatch = selectedCategory === "all" || 
      (selectedCategory === "fruits" && opportunity.product === "Avocados") ||
      (selectedCategory === "grains" && opportunity.product === "Quinoa") ||
      (selectedCategory === "coffee" && opportunity.product === "Coffee Beans");
    
    return regionMatch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Global Agricultural Trade
            </h1>
            <p className="text-xl mb-8 text-indigo-100">
              Connect with verified international suppliers and expand your market reach across borders
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
                Start Trading
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                Browse Opportunities
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Market Insights */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Global Market Insights</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketInsights.map((insight, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  {insight.icon}
                </div>
                <div className="text-2xl font-bold mb-2">{insight.value}</div>
                <div className="text-sm text-green-600 font-semibold mb-2">
                  {insight.change} from last month
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" />
            <h3 className="font-semibold">Filter Opportunities</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Product Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Trade Opportunities */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Active Trade Opportunities</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          {filteredOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Package className="w-4 h-4" />
                      {opportunity.product} • {opportunity.quantity}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {opportunity.price}
                    </div>
                    <Badge 
                      variant={opportunity.status === 'available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {opportunity.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Trade Route */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="text-sm font-medium">Origin</div>
                      <div className="text-xs text-gray-600">{opportunity.origin}</div>
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium">Destination</div>
                      <div className="text-xs text-gray-600">{opportunity.destination}</div>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Exporter</div>
                    <div className="text-sm">{opportunity.exporter}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Importer</div>
                    <div className="text-sm">{opportunity.importer}</div>
                  </div>
                </div>

                {/* Certification & Timeline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{opportunity.certification}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Deadline</div>
                    <div className="text-sm font-medium">
                      {new Date(opportunity.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">AI Match Confidence</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {opportunity.confidence}%
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline">
                    Contact Supplier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Expand Your Global Reach
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of farmers and buyers trading internationally through Wakulima's trusted platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
              List Your Products
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
              Find Suppliers
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GlobalTrade;
