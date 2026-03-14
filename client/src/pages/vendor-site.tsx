import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  ExternalLink,
  Award,
  Briefcase,
  Image as ImageIcon,
  Quote,
  Zap
} from "lucide-react";
import { SiGoogle, SiYelp } from "react-icons/si";
import type { Vendor, VendorService, VendorTestimonial, VendorPortfolio } from "@shared/schema";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

interface VendorPublicData {
  vendor: Vendor;
  services: VendorService[];
  testimonials: VendorTestimonial[];
  portfolio: VendorPortfolio[];
}

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  electrical: "Electrical Services",
  hvac: "HVAC & Heating",
  plumbing: "Plumbing",
  roofing: "Roofing",
  general_contractor: "General Contractor",
  painting: "Painting",
  flooring: "Flooring",
  landscaping: "Landscaping",
  security: "Security Systems",
  solar: "Solar Installation",
  other: "Professional Services",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-48 bg-muted animate-pulse" />
      <div className="container max-w-6xl mx-auto px-4 -mt-16">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Contractor Not Found</h1>
        <p className="text-muted-foreground mb-4">
          This contractor profile doesn't exist or is not yet active.
        </p>
        <Button asChild>
          <a href="/vendor/register">Join Our Network</a>
        </Button>
      </div>
    </div>
  );
}

export default function VendorSite() {
  const [, params] = useRoute("/contractor/:slug");
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery<VendorPublicData>({
    queryKey: ["/api/vendor/public", slug],
    enabled: !!slug,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data?.vendor) return <NotFound />;

  const { vendor, services, testimonials, portfolio } = data;
  const primaryColor = vendor.primary_color || "#e5fa00";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div 
        className="h-48 md:h-64 relative"
        style={{ 
          background: vendor.banner_url 
            ? `url(${vendor.banner_url}) center/cover` 
            : `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%)`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
          <div 
            className="h-32 w-32 rounded-xl border-4 border-background shadow-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: primaryColor }}
          >
            {vendor.logo_url ? (
              <img 
                src={vendor.logo_url} 
                alt={vendor.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-background">
                {vendor.name.charAt(0)}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{vendor.name}</h1>
              {vendor.onboarding_status === "approved" && (
                <Badge className="gap-1" style={{ backgroundColor: primaryColor, color: "#000" }}>
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            
            {vendor.tagline && (
              <p className="text-lg text-muted-foreground mb-2">{vendor.tagline}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">
                {SERVICE_CATEGORY_LABELS[vendor.service_category] || vendor.service_category}
              </Badge>
              
              {vendor.years_in_business && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {vendor.years_in_business}+ years
                </span>
              )}
              
              {vendor.average_rating && (
                <div className="flex items-center gap-1">
                  <StarRating rating={Math.round(Number(vendor.average_rating))} />
                  <span>({vendor.total_reviews || 0} reviews)</span>
                </div>
              )}

              {vendor.bonded && (
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-500" />
                  Bonded & Insured
                </span>
              )}
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              {vendor.phone && (
                <Button asChild size="sm">
                  <a href={`tel:${vendor.phone}`} data-testid="button-call">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </a>
                </Button>
              )}
              {vendor.email && (
                <Button variant="outline" asChild size="sm">
                  <a href={`mailto:${vendor.email}`} data-testid="button-email">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {vendor.accept_bookings && (
                <Button variant="outline" size="sm" data-testid="button-book">
                  <Calendar className="h-4 w-4 mr-2" />
                  Request Quote
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {vendor.about_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" style={{ color: primaryColor }} />
                    About Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {vendor.about_text}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: primaryColor }} />
                    Our Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                      >
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}20` }}
                        >
                          <CheckCircle2 className="h-5 w-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold">{service.name}</h3>
                            {vendor.show_pricing && service.price && (
                              <span className="font-bold" style={{ color: primaryColor }}>
                                ${service.price}
                                {service.price_unit && ` /${service.price_unit}`}
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services List (from vendor.services array) */}
            {vendor.services && vendor.services.length > 0 && services.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: primaryColor }} />
                    Services We Offer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vendor.services.map((service, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg border"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" style={{ color: primaryColor }} />
                    Our Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <div 
                        key={item.id}
                        className="relative aspect-square rounded-lg overflow-hidden group"
                      >
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h4 className="text-white font-medium text-sm">{item.title}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Quote className="h-5 w-5" style={{ color: primaryColor }} />
                    What Our Clients Say
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testimonials.map((testimonial) => (
                      <div 
                        key={testimonial.id}
                        className="p-4 rounded-lg border"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={testimonial.client_photo_url || undefined} />
                            <AvatarFallback>
                              {testimonial.client_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div>
                                <h4 className="font-semibold">{testimonial.client_name}</h4>
                                {testimonial.client_company && (
                                  <p className="text-xs text-muted-foreground">
                                    {testimonial.client_company}
                                  </p>
                                )}
                              </div>
                              <StarRating rating={testimonial.rating} />
                            </div>
                            <p className="text-muted-foreground italic">
                              "{testimonial.testimonial_text}"
                            </p>
                            {testimonial.service_provided && (
                              <Badge variant="outline" className="mt-2">
                                {testimonial.service_provided}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.phone && (
                  <a 
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                    {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a 
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                    {vendor.email}
                  </a>
                )}
                {(vendor.address || vendor.city) && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5" style={{ color: primaryColor }} />
                    <div>
                      {vendor.address && <div>{vendor.address}</div>}
                      {vendor.city && vendor.state && (
                        <div>{vendor.city}, {vendor.state} {vendor.zip}</div>
                      )}
                    </div>
                  </div>
                )}
                {vendor.website_url && (
                  <a 
                    href={vendor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4" style={{ color: primaryColor }} />
                    Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Service Areas */}
            {vendor.service_areas && vendor.service_areas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.service_areas.map((area, index) => (
                      <Badge key={index} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {vendor.certifications && vendor.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: primaryColor }} />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vendor.certifications.map((cert, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* License Info */}
            {vendor.license_number && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" style={{ color: primaryColor }} />
                    License
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="font-mono text-lg">{vendor.license_number}</div>
                    {vendor.license_state && (
                      <div className="text-muted-foreground">
                        State of {vendor.license_state}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(vendor.facebook_url || vendor.instagram_url || vendor.linkedin_url || vendor.google_business_url || vendor.yelp_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connect With Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {vendor.facebook_url && (
                      <a 
                        href={vendor.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover-elevate"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {vendor.instagram_url && (
                      <a 
                        href={vendor.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover-elevate"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {vendor.linkedin_url && (
                      <a 
                        href={vendor.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover-elevate"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {vendor.google_business_url && (
                      <a 
                        href={vendor.google_business_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover-elevate"
                      >
                        <SiGoogle className="h-5 w-5" />
                      </a>
                    )}
                    {vendor.yelp_url && (
                      <a 
                        href={vendor.yelp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover-elevate"
                      >
                        <SiYelp className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* T.G.E. PROS Badge */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <img src={tgeLogo} alt="T.G.E. PROS" className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Member of the T.G.E. PROS Contractor Network
                  </p>
                  <Separator className="my-4" />
                  <a 
                    href="/vendor/register"
                    className="text-sm text-primary hover:underline"
                  >
                    Join Our Network
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-12 mt-12 border-t">
          <p className="text-sm text-muted-foreground">
            {vendor.name} is a member of the T.G.E. PROS Contractor Network
          </p>
        </div>
      </div>
    </div>
  );
}
