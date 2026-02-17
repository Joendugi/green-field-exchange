import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, Heart, Share2 } from "lucide-react";

const FarmerStories = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const stories = [
    {
      id: 1,
      name: "Maria Rodriguez",
      location: "Salinas Valley, CA",
      avatar: "/avatars/maria.jpg",
      farm: "Green Valley Organics",
      story: "After 20 years of farming, AgriLink helped me connect directly with Bay Area families. My income increased 40% and I'm now teaching my children sustainable farming practices.",
      category: "organic",
      rating: 4.9,
      products: 45,
      joinedDate: "2023-06-15",
      featured: true,
      impact: "Feeds 200+ families weekly"
    },
    {
      id: 2,
      name: "James Chen",
      location: "Central Valley, CA",
      avatar: "/avatars/james.jpg",
      farm: "Sunrise Farms",
      story: "As a third-generation farmer, I was skeptical about technology. But AgriLink's transparent pricing and direct connections changed everything. We now sell 80% of our harvest before it's even picked.",
      category: "traditional",
      rating: 4.8,
      products: 32,
      joinedDate: "2023-03-20",
      featured: true,
      impact: "Preserved 150-acre family farm"
    },
    {
      id: 3,
      name: "Sarah Thompson",
      location: "Napa Valley, CA",
      avatar: "/avatars/sarah.jpg",
      farm: "Heritage Harvest",
      story: "Starting as a small-scale farmer seemed impossible until AgriLink. The platform gave me access to markets I could only dream of. Now I'm mentoring other young farmers in our community.",
      category: "new-farmer",
      rating: 5.0,
      products: 18,
      joinedDate: "2024-01-10",
      featured: true,
      impact: "Empowered 5 new farmers"
    }
  ];

  const categories = [
    { id: "all", label: "All Stories", color: "bg-gray-100" },
    { id: "organic", label: "Organic Farmers", color: "bg-green-100" },
    { id: "traditional", label: "Family Farms", color: "bg-blue-100" },
    { id: "new-farmer", label: "New Generation", color: "bg-purple-100" }
  ];

  const filteredStories = selectedCategory === "all" 
    ? stories 
    : stories.filter(story => story.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Farmer Stories
            </h1>
            <p className="text-xl mb-8 text-green-100">
              Real stories from farmers who are transforming their livelihoods through AgriLink
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Share Your Story
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Watch Video Stories
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`rounded-full ${
                selectedCategory === category.id 
                  ? "bg-green-600 text-white" 
                  : category.color + " hover:bg-opacity-80"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Featured Stories Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStories.map((story) => (
            <Card key={story.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Story Header */}
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={story.avatar} alt={story.name} />
                    <AvatarFallback className="text-2xl bg-green-600 text-white">
                      {story.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {story.featured && (
                  <Badge className="absolute top-4 right-4 bg-yellow-400 text-yellow-900">
                    Featured
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{story.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4" />
                      {story.location}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {story.rating}
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {story.farm}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {story.story}
                </p>

                <div className="space-y-3">
                  {/* Impact Metrics */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      🌱 {story.impact}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{story.products} products listed</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(story.joinedDate).getFullYear()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Share Your Farming Journey
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Every farmer has a story. Your experience can inspire and help others in our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              Submit Your Story
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

export default FarmerStories;
