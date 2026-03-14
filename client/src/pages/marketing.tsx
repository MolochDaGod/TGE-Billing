import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Copy, Check, Sparkles, Trash2, Facebook, Linkedin, Twitter } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import type { MarketingContent } from "@shared/schema";

interface GeneratedVariation {
  tone: string;
  content: string;
}

interface GeneratedContent {
  variations: GeneratedVariation[];
}

const electricianTemplates = [
  {
    name: "Safety Tips",
    description: "Electrical safety tip: Always turn off power at the circuit breaker before working on any electrical outlet or switch. Don't take chances with electricity - call T.G.E. Billing (License #750779) for safe, professional electrical work. We make power easy!"
  },
  {
    name: "Emergency Service",
    description: "EMERGENCY ELECTRICAL SERVICE AVAILABLE 24/7! Power outage? Sparking outlet? Breaker keeps tripping? T.G.E. Billing responds fast with licensed Master Electricians. Texas License #750779. We're here when you need us - day or night!"
  },
  {
    name: "Panel Upgrade",
    description: "Is your electrical panel outdated? Upgrade to a modern 200-amp panel for safer, more reliable power. T.G.E. Billing provides professional panel upgrades fully compliant with NEC 2023 standards. Licensed Master Electrician #750779. Call for a free estimate!"
  },
  {
    name: "GFCI Installation",
    description: "Protect your family from electrical shocks! GFCI outlets are required in kitchens, bathrooms, garages, and outdoor areas per NEC code. T.G.E. Billing installs code-compliant GFCI protection. Texas Master Electrician License #750779. Schedule your safety upgrade today!"
  },
  {
    name: "Seasonal Check",
    description: "Beat the heat! Before summer's peak demand hits, get your electrical system inspected by T.G.E. Billing. We check panels, outlets, HVAC connections, and more to prevent outages when you need AC most. Licensed professionals - Texas #750779. Book your inspection now!"
  },
  {
    name: "LED Upgrade",
    description: "Save money and energy with LED lighting! T.G.E. Billing installs modern, efficient LED fixtures that slash your energy bills by up to 75%. Brighter homes, lower costs, professional installation. Texas Master Electrician License #750779. Light up your life!"
  },
  {
    name: "Code Compliance",
    description: "Selling your home? Ensure electrical code compliance with T.G.E. Billing's comprehensive inspection service. We identify and fix NEC violations before they delay your sale. TDLR-licensed, fully insured. Texas Master Electrician #750779. Get inspection-ready today!"
  },
  {
    name: "EV Charger Install",
    description: "Drive electric? T.G.E. Billing installs Level 2 EV chargers for fast, convenient home charging. We handle permits, panel upgrades, and code-compliant installation. Licensed Master Electrician #750779. Power your EV at home - schedule installation today!"
  }
];

export default function Marketing() {
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: savedContent = [], isLoading: loadingSaved } = useQuery<MarketingContent[]>({
    queryKey: ["/api/marketing"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { description: string; platform: string }) => {
      const res = await apiRequest("POST", "/api/marketing/generate", data);
      return await res.json() as GeneratedContent;
    },
    onSuccess: (data: GeneratedContent) => {
      setGeneratedContent(data);
      toast({
        title: "Content generated!",
        description: "Your marketing content has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Failed to generate marketing content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { platform: string; content_type: string; body: string; title: string }) => {
      const res = await apiRequest("POST", "/api/marketing", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing"] });
      toast({
        title: "Saved to library",
        description: "Content has been saved to your marketing library.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save content to library.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/marketing/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing"] });
      toast({
        title: "Content deleted",
        description: "Marketing content has been removed from your library.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete content.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a service description or promotion details.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ description, platform });
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSave = (variation: GeneratedVariation) => {
    saveMutation.mutate({
      platform,
      content_type: variation.tone,
      body: variation.content,
      title: `${platform} - ${variation.tone}`,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this content?")) {
      deleteMutation.mutate(id);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const iconMap: Record<string, any> = {
      facebook: Facebook,
      instagram: SiInstagram,
      linkedin: Linkedin,
      twitter: Twitter,
    };
    const Icon = iconMap[platformName.toLowerCase()] || Facebook;
    return <Icon className="h-4 w-4" />;
  };

  const getPlatformColor = (platformName: string) => {
    const colorMap: Record<string, string> = {
      facebook: "bg-blue-500",
      instagram: "bg-pink-500",
      linkedin: "bg-blue-700",
      twitter: "bg-sky-500",
    };
    return colorMap[platformName.toLowerCase()] || "bg-primary";
  };

  return (
    <div className="space-y-8" data-testid="page-marketing">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-marketing">Marketing Content Generator</h1>
        <p className="text-muted-foreground mt-2" data-testid="text-description">
          Use AI to create engaging social media content for your electrical services
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList data-testid="tabs-marketing">
          <TabsTrigger value="generate" data-testid="tab-generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library">
            Library
            {savedContent.length > 0 && (
              <Badge variant="secondary" className="ml-2" data-testid="badge-library-count">
                {savedContent.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card data-testid="card-generator">
            <CardHeader>
              <CardTitle data-testid="heading-generator">Create New Content</CardTitle>
              <CardDescription data-testid="text-generator-description">
                Describe your service or promotion, select a platform, and let AI create engaging content for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label data-testid="label-quick-templates">Quick Templates for Electricians</Label>
                <p className="text-sm text-muted-foreground mb-3">Click a template to auto-fill content, then customize as needed</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {electricianTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      className="h-auto flex-col items-start p-3 hover-elevate"
                      onClick={() => {
                        setDescription(template.description);
                        toast({
                          title: "Template loaded!",
                          description: `${template.name} template ready to customize.`,
                        });
                      }}
                      data-testid={`button-template-${template.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className="text-xs font-medium text-left">{template.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" data-testid="label-description">
                  Service Description or Promotion Details
                </Label>
                <Textarea
                  id="description"
                  placeholder="Example: Emergency electrical repairs available 24/7. Fast response time, licensed electricians, competitive pricing... or click a template above!"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform" data-testid="label-platform">
                  Social Media Platform
                </Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="platform" data-testid="select-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook" data-testid="option-facebook">
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </div>
                    </SelectItem>
                    <SelectItem value="instagram" data-testid="option-instagram">
                      <div className="flex items-center gap-2">
                        <SiInstagram className="h-4 w-4" />
                        Instagram
                      </div>
                    </SelectItem>
                    <SelectItem value="linkedin" data-testid="option-linkedin">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </div>
                    </SelectItem>
                    <SelectItem value="twitter" data-testid="option-twitter">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter/X
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !description.trim()}
                className="w-full"
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedContent && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold" data-testid="heading-variations">Generated Variations</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {generatedContent.variations.map((variation, index) => (
                  <Card key={index} className="flex flex-col" data-testid={`card-variation-${index}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base capitalize" data-testid={`text-tone-${index}`}>
                          {variation.tone}
                        </CardTitle>
                        <Badge variant="outline" data-testid={`badge-platform-${index}`}>
                          <span className="flex items-center gap-1">
                            {getPlatformIcon(platform)}
                            {platform}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${index}`}>
                        {variation.content}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(variation.content, index)}
                        className="flex-1"
                        data-testid={`button-copy-${index}`}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(variation)}
                        disabled={saveMutation.isPending}
                        className="flex-1"
                        data-testid={`button-save-${index}`}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Save
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold" data-testid="heading-library">Saved Marketing Content</h2>
            <p className="text-muted-foreground text-sm mt-1" data-testid="text-library-description">
              Your saved marketing content library
            </p>
          </div>

          {loadingSaved ? (
            <div className="flex items-center justify-center py-12" data-testid="loader-library">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : savedContent.length === 0 ? (
            <Card data-testid="card-empty-library">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground" data-testid="text-empty-library">
                  No saved content yet. Generate and save some content to build your library!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedContent.map((content) => (
                <Card key={content.id} className="flex flex-col" data-testid={`card-saved-${content.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base capitalize" data-testid={`text-saved-type-${content.id}`}>
                        {content.content_type}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`${getPlatformColor(content.platform)} text-white border-0`}
                        data-testid={`badge-saved-platform-${content.id}`}
                      >
                        <span className="flex items-center gap-1">
                          {getPlatformIcon(content.platform)}
                          {content.platform}
                        </span>
                      </Badge>
                    </div>
                    <CardDescription data-testid={`text-saved-date-${content.id}`}>
                      {new Date(content.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm whitespace-pre-wrap" data-testid={`text-saved-content-${content.id}`}>
                      {content.body}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(content.body, -1)}
                      className="flex-1"
                      data-testid={`button-copy-saved-${content.id}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(content.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${content.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
