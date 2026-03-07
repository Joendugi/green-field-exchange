import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Sun, 
  Thermometer, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  MapPin,
  Calendar
} from "lucide-react";

const AIInsights = () => {
  const [selectedCrop, setSelectedCrop] = useState("tomatoes");
  const [selectedRegion, setSelectedRegion] = useState("central_valley");

  const cropRecommendations = [
    {
      crop: "Tomatoes",
      demand: "high",
      priceTrend: "up",
      optimalPrice: "$3.50/lb",
      bestRegions: ["Central Valley", "Salinas Valley"],
      season: "May - October",
      confidence: 92,
      insights: [
        "Demand expected to increase 15% next quarter",
        "Organic varieties commanding premium prices",
        "Restaurant demand strong in Bay Area"
      ]
    },
    {
      crop: "Lettuce",
      demand: "medium",
      priceTrend: "stable",
      optimalPrice: "$2.20/lb",
      bestRegions: ["Salinas Valley", "Central Coast"],
      season: "Year-round",
      confidence: 88,
      insights: [
        "Stable demand throughout the year",
        "Hydroponic varieties gaining market share",
        "Food service contracts available"
      ]
    },
    {
      crop: "Strawberries",
      demand: "very_high",
      priceTrend: "up",
      optimalPrice: "$5.80/lb",
      bestRegions: ["Watsonville", "Santa Maria"],
      season: "March - November",
      confidence: 95,
      insights: [
        "Export demand increasing 20% YoY",
        "Organic certification worth 40% premium",
        "U-pick operations profitable"
      ]
    }
  ];

  const marketTrends = [
    {
      title: "Organic Premium Growing",
      change: "+18%",
      description: "Consumers willing to pay more for certified organic produce",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
    {
      title: "Local Food Demand",
      change: "+25%",
      description: "Farmers markets and direct-to-consumer sales expanding",
      icon: <TrendingUp className="w-5 h-5 text-green-600" />
    },
    {
      title: "Water Costs Rising",
      change: "+12%",
      description: "Irrigation expenses impacting profit margins",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
    },
    {
      title: "Labor Shortages",
      change: "-8%",
      description: "Available workforce decreasing seasonally",
      icon: <TrendingDown className="w-5 h-5 text-red-600" />
    }
  ];

  const weatherInsights = [
    {
      type: "Temperature",
      current: "72°F",
      forecast: "75°F",
      status: "optimal",
      icon: <Thermometer className="w-6 h-6 text-orange-500" />
    },
    {
      type: "Rainfall",
      current: "0.2\"",
      forecast: "0.1\"",
      status: "low",
      icon: <Droplets className="w-6 h-6 text-blue-500" />
    },
    {
      type: "Sunlight",
      current: "8.5 hrs",
      forecast: "9.2 hrs",
      status: "good",
      icon: <Sun className="w-6 h-6 text-yellow-500" />
    }
  ];

  const selectedCropData = cropRecommendations.find(c => c.crop.toLowerCase() === selectedCrop.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              AI-Powered Farming Insights
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Leverage artificial intelligence to optimize your farming decisions and maximize profits
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg">
                Get Personalized Insights
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-sm font-semibold shadow-lg">
                View Market Reports
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10 pointer-events-none"></div>
      </section>

      {/* Controls */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800">Select Crop</label>
            <select 
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {cropRecommendations.map(crop => (
                <option key={crop.crop} value={crop.crop.toLowerCase()} className="text-gray-900">
                  {crop.crop}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800">Select Region</label>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="central_valley" className="text-gray-900">Central Valley</option>
              <option value="salinas_valley" className="text-gray-900">Salinas Valley</option>
              <option value="central_coast" className="text-gray-900">Central Coast</option>
              <option value="bay_area" className="text-gray-900">Bay Area</option>
            </select>
          </div>
        </div>
      </section>

      {/* Crop Recommendations */}
      {selectedCropData && (
        <section className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    {selectedCropData.crop} Market Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights for optimal pricing and timing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedCropData.optimalPrice}
                      </div>
                      <div className="text-sm text-gray-600">Optimal Price</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedCropData.demand.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600">Demand Level</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedCropData.confidence}%
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                  </div>

                  {/* Price Trend */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    {selectedCropData.priceTrend === 'up' ? (
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold">Price Trend: {selectedCropData.priceTrend}</div>
                      <div className="text-sm text-gray-600">Based on 30-day market analysis</div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div>
                    <h4 className="font-semibold mb-3">AI Insights</h4>
                    <div className="space-y-2">
                      {selectedCropData.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Regions & Season */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Best Regions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCropData.bestRegions.map((region, index) => (
                          <Badge key={index} variant="secondary">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Growing Season
                      </h4>
                      <p className="text-sm text-gray-600">{selectedCropData.season}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Trends Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Trends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {marketTrends.map((trend, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {trend.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{trend.title}</span>
                          <span className={`text-sm font-bold ${
                            trend.change.startsWith('+') ? 'text-green-600' : 
                            trend.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {trend.change}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{trend.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weather Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weather Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weatherInsights.map((weather, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {weather.icon}
                        <div>
                          <div className="font-medium text-sm">{weather.type}</div>
                          <div className="text-xs text-gray-600">Current: {weather.current}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Forecast</div>
                        <div className="text-sm font-medium">{weather.forecast}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Get Advanced AI Insights
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Upgrade to premium for personalized recommendations, detailed market analysis, and predictive analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Upgrade to Premium
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIInsights;
