import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, Heart, Share2, Quote, Loader2, MessageCircle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const FarmerStories = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const featuredPosts = useQuery(api.posts.getFeaturedStories) || [];

  const staticStories = [
    {
      id: "s1",
      name: "Maria Rodriguez",
      location: "Salinas Valley, CA",
      avatar: "/avatars/maria.jpg",
      farm: "Green Valley Organics",
      story: "After 20 years of farming, Wakulima helped me connect directly with Bay Area families. My income increased 40% and I'm now teaching my children sustainable farming practices.",
      category: "organic",
      rating: 4.9,
      products: 45,
      joinedDate: "2023-06-15",
      isStatic: true,
      impact: "Feeds 200+ families weekly"
    },
    {
      id: "s2",
      name: "James Chen",
      location: "Central Valley, CA",
      avatar: "/avatars/james.jpg",
      farm: "Sunrise Farms",
      story: "As a third-generation farmer, I was skeptical about technology. But Wakulima's transparent pricing and direct connections changed everything. We now sell 80% of our harvest before it's even picked.",
      category: "traditional",
      rating: 4.8,
      products: 32,
      joinedDate: "2023-03-20",
      isStatic: true,
      impact: "Preserved 150-acre family farm"
    }
  ];

  const categories = [
    { id: "all", label: "All Stories", color: "bg-white text-gray-700 border-gray-200" },
    { id: "organic", label: "Organic Farmers", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { id: "community", label: "Marketplace Voices", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { id: "traditional", label: "Family Farms", color: "bg-amber-50 text-amber-700 border-amber-200" }
  ];

  // Interleave featured posts into stories
  const postsAsStories = featuredPosts.map(post => ({
    id: post._id,
    name: post.profiles?.full_name || post.profiles?.username || "Wakulima Farmer",
    location: post.profiles?.location || "Unknown Location",
    avatar: post.profiles?.avatar_url,
    farm: post.profiles?.bio?.split('.')[0] || "Harvest Community",
    story: post.content,
    category: "community",
    rating: (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1), // Visual aesthetic
    products: Math.floor(Math.random() * 20) + 5,
    joinedDate: post._creationTime,
    isStatic: false,
    image: post.image_url,
    impact: `Active since ${formatDistanceToNow(post._creationTime)} ago`
  }));

  const combinedStories = [...staticStories, ...postsAsStories];
  const filteredStories = selectedCategory === "all" 
    ? combinedStories 
    : combinedStories.filter(story => story.category === selectedCategory);

  return (
    <div className="min-h-screen bg-card text-foreground transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-green-600 to-emerald-700 text-white rounded-b-[3rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1 text-sm backdrop-blur-md">
              Community Voices
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
              Farmer Stories
            </h1>
            <p className="text-xl md:text-2xl text-green-100/90 leading-relaxed max-w-2xl mx-auto">
              Real success from the fields. Discover the people behind your food and their journey with Wakulima.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Button size="lg" className="bg-white text-primary hover:bg-green-50 font-bold px-8 h-14 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95" onClick={() => navigate("/social")}>
                Join Social Feed
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 h-14 rounded-2xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
                Watch Documentaries
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-background/80 backdrop-blur-xl border border-border p-3 rounded-3xl shadow-2xl max-w-fit mx-auto flex flex-wrap justify-center gap-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              className={`rounded-2xl px-6 py-2.5 font-bold text-sm transition-all duration-300 ${
                selectedCategory === category.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : category.color + " hover:bg-opacity-80"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Stories Grid */}
      <section className="container mx-auto px-4 py-16">
        {featuredPosts === undefined ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => (
              <Card key={story.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-border/50 flex flex-col hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
                <div className="relative h-56 overflow-hidden">
                   {story.image ? (
                        <img src={story.image} alt="Story" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   ) : (
                        <div className="h-full bg-gradient-to-br from-primary/10 to-emerald-100 flex items-center justify-center">
                            <Quote className="h-16 w-16 text-primary/20 rotate-180" />
                        </div>
                   )}
                   <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {story.isStatic ? (
                            <Badge className="bg-amber-400 text-amber-950 font-bold border-none">
                                Featured Legend
                            </Badge>
                        ) : (
                            <Badge className="bg-blue-500 text-white font-bold border-none flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> Community Post
                            </Badge>
                        )}
                   </div>
                </div>

                <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                                <AvatarImage src={story.avatar} />
                                <AvatarFallback className="bg-primary text-white font-bold uppercase">
                                    {story.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{story.name}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {story.location}
                                </p>
                            </div>
                         </div>
                         <Badge variant="outline" className="text-primary font-bold border-primary/20 bg-primary/5">
                            ★ {story.rating}
                         </Badge>
                    </div>

                    <div className="relative">
                        <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/10 -z-10" />
                        <p className="text-sm text-foreground/80 leading-relaxed italic line-clamp-4 pl-4 border-l-2 border-primary/20">
                            "{story.story}"
                        </p>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-[10px] font-semibold bg-muted uppercase tracking-wider">
                            {story.farm}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                            {story.products} Products
                        </Badge>
                    </div>
                </div>

                <CardFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {story.impact}
                    </p>
                    <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500">
                             <Heart className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                             <Share2 className="h-4 w-4" />
                         </Button>
                    </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Marketplace Call to Action */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-primary opacity-50" />
           <div className="relative z-10 space-y-6">
                <h2 className="text-4xl font-bold">Want to be our next success story?</h2>
                <p className="text-xl text-green-100 max-w-2xl mx-auto">
                    Whether you're a first-time farmer or a marketplace pro, we're here to help you grow your footprint.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button size="lg" className="bg-white text-primary hover:bg-green-50 font-bold px-10 rounded-2xl h-14" onClick={() => navigate("/dashboard?tab=products")}>
                        Start Selling Today
                    </Button>
                    <Button size="lg" variant="outline" className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 px-10 rounded-2xl h-14 font-bold">
                        Talk to an Advisor
                    </Button>
                </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default FarmerStories;
