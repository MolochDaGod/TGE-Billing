import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import { Share2, Copy, Check, Gift, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface SocialShareProps {
  referralCode?: string;
  userName?: string;
}

export function SocialShare({ referralCode, userName }: SocialShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: settings } = useQuery<{
    company_name?: string;
    license_number?: string;
  }>({
    queryKey: ["/api/settings"],
  });

  const companyName = settings?.company_name || "T.G.E. Billing";
  const licenseNumber = settings?.license_number || "#750779";

  const referralUrl = referralCode 
    ? `${window.location.origin}?ref=${referralCode}` 
    : window.location.origin;

  const shareMessages = {
    facebook: `Just had an amazing experience with ${companyName} (TX License ${licenseNumber})! Professional electrical services that make power easy. Highly recommend! 🔌⚡`,
    twitter: `Excellent electrical work by ${companyName} (TX License ${licenseNumber})! They truly make power easy. ${referralUrl}`,
    linkedin: `I'm happy to recommend ${companyName} (Texas Master Class Electrician License ${licenseNumber}) for professional electrical services. Their team delivers quality work with outstanding customer service. Lighting your life in any situation! ${referralUrl}`,
    general: `Check out ${companyName} - professional electrical services in Texas. We make power easy!`
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your referral link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(shareMessages.facebook)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessages.twitter)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle>Refer & Earn Rewards</CardTitle>
          </div>
          <CardDescription>
            Share your experience with {companyName} and help us grow! When someone books through your referral link, you both get special benefits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="referral-code">Your Referral Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="referral-code"
                    value={referralCode}
                    readOnly
                    className="font-mono"
                    data-testid="input-referral-code"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralLink}
                    data-testid="button-copy-referral"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Referral Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={referralUrl}
                    readOnly
                    className="text-xs"
                    data-testid="input-referral-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralLink}
                    data-testid="button-copy-url"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />
            </>
          )}

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share on Social Media
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={shareOnFacebook}
                data-testid="button-share-facebook"
              >
                <SiFacebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={shareOnTwitter}
                data-testid="button-share-twitter"
              >
                <SiX className="h-4 w-4" />
                X (Twitter)
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={shareOnLinkedIn}
                data-testid="button-share-linkedin"
              >
                <SiLinkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Why Share?</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Help friends find reliable electrical services</li>
                  <li>• Support a local Texas business</li>
                  <li>• Build community trust and safety</li>
                  {referralCode && <li>• Earn rewards for successful referrals</li>}
                </ul>
              </div>
            </div>
          </div>

          {referralCode && (
            <div className="flex flex-wrap gap-2 items-center justify-center pt-2">
              <Badge variant="secondary" className="text-xs">
                Share 3 times, get 10% off
              </Badge>
              <Badge variant="secondary" className="text-xs">
                First referral gets $25 credit
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Promotional Content Templates</CardTitle>
          <CardDescription>
            Copy and paste these ready-made messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Facebook Post</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareMessages.facebook);
                  toast({ title: "Copied!", description: "Facebook message copied to clipboard." });
                }}
                data-testid="button-copy-facebook-template"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm">
              {shareMessages.facebook}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">X (Twitter) Post</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareMessages.twitter);
                  toast({ title: "Copied!", description: "Twitter message copied to clipboard." });
                }}
                data-testid="button-copy-twitter-template"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm">
              {shareMessages.twitter}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">LinkedIn Recommendation</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareMessages.linkedin);
                  toast({ title: "Copied!", description: "LinkedIn message copied to clipboard." });
                }}
                data-testid="button-copy-linkedin-template"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-line">
              {shareMessages.linkedin}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
