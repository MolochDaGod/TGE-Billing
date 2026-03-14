import { SocialShare } from "@/components/social-share";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Award, Zap, MessageSquare, Mail, Link2, Copy, QrCode, Share2 } from "lucide-react";
import { SiFacebook, SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

const QUICK_SHARE_OPTIONS = [
  {
    id: "copy_link",
    name: "Copy Link",
    icon: Copy,
    description: "Copy referral link",
    action: "copy"
  },
  {
    id: "text_message",
    name: "Text Message",
    icon: MessageSquare,
    description: "Send via SMS",
    action: "sms"
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: SiWhatsapp,
    description: "Share on WhatsApp",
    action: "whatsapp"
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    description: "Send via email",
    action: "email"
  },
];

export default function Referrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const referralLink = user?.referral_code 
    ? `${window.location.origin}?ref=${user.referral_code}`
    : `${window.location.origin}`;
  
  const referralMessage = `Check out T.G.E. PROS - Professional electrical services! Use my referral link: ${referralLink}`;

  const handleQuickShare = async (action: string) => {
    switch (action) {
      case "copy":
        try {
          await navigator.clipboard.writeText(referralLink);
          toast({
            title: "Link Copied!",
            description: "Referral link copied to clipboard",
          });
        } catch {
          toast({
            title: "Copy Failed",
            description: "Please copy the link manually",
            variant: "destructive",
          });
        }
        break;
      case "sms":
        window.open(`sms:?body=${encodeURIComponent(referralMessage)}`, '_blank');
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(referralMessage)}`, '_blank');
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent("Try T.G.E. PROS Electrical Services!")}&body=${encodeURIComponent(referralMessage)}`, '_blank');
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Share & Earn</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Help us grow by sharing your experience. Earn rewards while helping friends find quality electrical services.
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Share</CardTitle>
            </div>
            <CardDescription>Instantly share your referral link</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_SHARE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
                  onClick={() => handleQuickShare(option.action)}
                  data-testid={`button-quick-${option.id}`}
                >
                  <option.icon className="h-6 w-6 text-primary" />
                  <span className="font-medium text-sm">{option.name}</span>
                  <span className="text-xs text-muted-foreground text-center">{option.description}</span>
                </Button>
              ))}
            </div>
            {user?.referral_code && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Your referral code:</p>
                <p className="font-mono font-bold text-primary">{user.referral_code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-stat-referrals">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-referral-count">0</div>
              <p className="text-xs text-muted-foreground">
                Total referrals made
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-rewards">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-rewards-amount">$0</div>
              <p className="text-xs text-muted-foreground">
                In credits and discounts
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-impact">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Impact</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-impact-score">0</div>
              <p className="text-xs text-muted-foreground">
                Friends helped
              </p>
            </CardContent>
          </Card>
        </div>

        <SocialShare 
          referralCode={user?.referral_code || undefined}
          userName={user?.name}
        />
      </div>
    </div>
  );
}
