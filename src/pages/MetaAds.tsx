import { useState, useEffect } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { 
  getMetaAnalytics, 
  getMetaAdCampaigns, 
  getMetaAudiences,
  trackMetaPixel,
  trackMetaConversion,
  createMetaAdCampaign,
  createMetaCustomAudience
} from "@/integrations/supabase/metaAds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Facebook,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Eye,
  MousePointer,
  ShoppingCart,
  Plus,
  BarChart3,
  Settings,
  Calendar,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const MetaAds = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const { data: analytics, isLoading: isLoadingAnalytics } = useSupabaseQuery<any>(
    ["meta", "analytics"],
    () => getMetaAnalytics({
      userId: user?.id,
      dateRange: {
        start: Date.now() - (30 * 24 * 60 * 60 * 1000),
        end: Date.now(),
      }
    })
  );

  const { data: campaigns, isLoading: isLoadingCampaigns } = useSupabaseQuery<any[]>(
    ["meta", "campaigns"],
    () => getMetaAdCampaigns({ userId: user?.id, limit: 10 })
  );

  const { data: audiences, isLoading: isLoadingAudiences } = useSupabaseQuery<any[]>(
    ["meta", "audiences"],
    () => getMetaAudiences(user?.id)
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showAudienceForm, setShowAudienceForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    campaignName: "",
    campaignObjective: "conversions",
    budget: 100,
    currency: "USD",
    startDate: Date.now(),
    endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
    targetAudience: "",
    creativeAssets: []
  });
  const [audienceForm, setAudienceForm] = useState({
    audienceName: "",
    audienceDescription: "",
    audienceType: "retargeting",
    criteria: {}
  });

  // Meta Pixel initialization (placeholder for production setup)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Meta Pixel integration ready - add YOUR_META_PIXEL_ID to initialize');
    }
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Authentication required");
      return;
    }

    try {
      await createMetaAdCampaign({
        ...campaignForm,
        userId: user.id,
        targetAudience: campaignForm.targetAudience || undefined
      });

      toast.success("Campaign created successfully!");
      queryClient.invalidateQueries({ queryKey: ["meta", "campaigns"] });
      setShowCampaignForm(false);
      setCampaignForm({
        campaignName: "",
        campaignObjective: "conversions",
        budget: 100,
        currency: "USD",
        startDate: Date.now(),
        endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
        targetAudience: "",
        creativeAssets: []
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    }
  };

  const handleCreateAudience = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Authentication required");
      return;
    }

    try {
      await createMetaCustomAudience({
        ...audienceForm,
        userId: user.id
      });

      toast.success("Audience created successfully!");
      queryClient.invalidateQueries({ queryKey: ["meta", "audiences"] });
      setShowAudienceForm(false);
      setAudienceForm({
        audienceName: "",
        audienceDescription: "",
        audienceType: "retargeting",
        criteria: {}
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create audience");
    }
  };

  const handleTrackConversion = async (type: string, value: number) => {
    if (!user) return;
    try {
      await trackMetaConversion({
        conversionType: type,
        conversionData: { timestamp: Date.now() },
        userId: user.id,
        value,
        currency: "USD"
      });

      toast.success("Conversion tracked successfully!");
    } catch (error: any) {
      toast.error("Failed to track conversion");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meta Ads Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your Facebook and Instagram advertising campaigns</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowCampaignForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
            <Button variant="outline" onClick={() => setShowAudienceForm(true)}>
              <Users className="w-4 h-4 mr-2" />
              New Audience
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              30-Day Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
                <div className="text-center py-8 text-gray-500">
                    Loading analytics...
                </div>
            ) : analytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalImpressions?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Impressions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.totalClicks?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{analytics.totalConversions?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Conversions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.totalSpend || 0)}</div>
                  <div className="text-sm text-gray-600">Total Spend</div>
                </div>
              </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No analytics data found.
                </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Pixel Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Facebook className="w-4 h-4" />
                    <AlertDescription>
                      Meta Pixel is initialized and tracking page views, add to cart, and purchase events.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleTrackConversion("page_view", 0)}
                      className="w-full"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Track Page View
                    </Button>
                    <Button
                      onClick={() => handleTrackConversion("add_to_cart", 50)}
                      className="w-full"
                      variant="outline"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Track Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleTrackConversion("purchase", 100)}
                      className="w-full"
                      variant="outline"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Track Purchase
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Average CTR</span>
                        <span className="font-semibold">{(analytics.averageCTR * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average CPC</span>
                        <span className="font-semibold">{formatCurrency(analytics.averageCPC)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Events</span>
                        <span className="font-semibold">{analytics.pixelEvents?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Campaigns</span>
                        <span className="font-semibold">{campaigns?.length || 0}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid gap-4">
              {isLoadingCampaigns ? (
                  <p>Loading campaigns...</p>
              ) : campaigns?.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
                        <p className="text-sm text-gray-600">{campaign.campaign_objective}</p>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Budget</div>
                        <div className="font-semibold">{formatCurrency(campaign.budget)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Spend</div>
                        <div className="font-semibold">{formatCurrency(campaign.metrics?.spend || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Impressions</div>
                        <div className="font-semibold">{campaign.metrics?.impressions?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Conversions</div>
                        <div className="font-semibold">{campaign.metrics?.conversions || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Audiences Tab */}
          <TabsContent value="audiences" className="space-y-6">
            <div className="grid gap-4">
              {isLoadingAudiences ? (
                  <p>Loading audiences...</p>
              ) : audiences?.map((audience) => (
                <Card key={audience.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{audience.audience_name}</h3>
                        <p className="text-sm text-gray-600">{audience.audience_description}</p>
                      </div>
                      <Badge variant="outline">
                        {audience.audience_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Conversions Tab */}
          <TabsContent value="conversions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recent Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => handleTrackConversion("signup", 0)}
                    className="w-full"
                    variant="outline"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Track User Signup
                  </Button>
                  <Button
                    onClick={() => handleTrackConversion("lead", 25)}
                    className="w-full"
                    variant="outline"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Track Lead Generation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Campaign Creation Modal */}
        {showCampaignForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <Input
                      value={campaignForm.campaignName}
                      onChange={(e) => setCampaignForm({ ...campaignForm, campaignName: e.target.value })}
                      placeholder="Summer Sale Campaign"
                      required
                    />
                  </div>
                  <div>
                    <Label>Objective</Label>
                    <Select value={campaignForm.campaignObjective} onValueChange={(value) => setCampaignForm({ ...campaignForm, campaignObjective: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awareness">Brand Awareness</SelectItem>
                        <SelectItem value="traffic">Website Traffic</SelectItem>
                        <SelectItem value="conversions">Conversions</SelectItem>
                        <SelectItem value="lead_generation">Lead Generation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Budget (USD)</Label>
                      <Input
                        type="number"
                        value={campaignForm.budget}
                        onChange={(e) => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })}
                        placeholder="100"
                        required
                      />
                    </div>
                    <div>
                      <Label>Duration (days)</Label>
                      <Input
                        type="number"
                        value={Math.floor((campaignForm.endDate - campaignForm.startDate) / (24 * 60 * 60 * 1000))}
                        onChange={(e) => setCampaignForm({
                          ...campaignForm,
                          endDate: campaignForm.startDate + (Number(e.target.value) * 24 * 60 * 60 * 1000)
                        })}
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Campaign</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCampaignForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audience Creation Modal */}
        {showAudienceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <CardTitle>Create New Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAudience} className="space-y-4">
                  <div>
                    <Label>Audience Name</Label>
                    <Input
                      value={audienceForm.audienceName}
                      onChange={(e) => setAudienceForm({ ...audienceForm, audienceName: e.target.value })}
                      placeholder="Website Visitors"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={audienceForm.audienceDescription}
                      onChange={(e) => setAudienceForm({ ...audienceForm, audienceDescription: e.target.value })}
                      placeholder="Users who visited the website in the last 30 days"
                      required
                    />
                  </div>
                  <div>
                    <Label>Audience Type</Label>
                    <Select value={audienceForm.audienceType} onValueChange={(value) => setAudienceForm({ ...audienceForm, audienceType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retargeting">Retargeting</SelectItem>
                        <SelectItem value="lookalike">Lookalike</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Audience</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAudienceForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaAds;

