import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Zap,
  Home,
  Building2,
  AlertTriangle,
  Lightbulb,
  Shield,
  Clock,
  CheckCircle2,
  Star,
  Award,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { SiYelp } from "react-icons/si";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

const services = [
  {
    icon: Home,
    title: "Residential Installations",
    description: "Complete electrical installations for new homes, renovations, and upgrades. Panel replacements, wiring, outlets, and more.",
  },
  {
    icon: Building2,
    title: "Commercial Repairs",
    description: "Reliable electrical repair services for businesses throughout Houston. Minimize downtime with our professional team.",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Services",
    description: "24/7 emergency electrical support when you need it most. Fast response times for urgent electrical issues.",
  },
  {
    icon: Lightbulb,
    title: "Lighting Solutions",
    description: "Custom lighting design and installation for any space. LED upgrades, landscape lighting, and smart controls.",
  },
];

const features = [
  { icon: Shield, text: "Licensed & Insured" },
  { icon: Award, text: "Master Electrician" },
  { icon: Clock, text: "24/7 Emergency Service" },
  { icon: CheckCircle2, text: "Free Estimates" },
];

export default function TGEElectrical() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Company Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 mb-6">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Texas Master Electrician License #750779</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4" data-testid="text-company-name">
                T.G.E. Electrical Company
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-200 mb-4" data-testid="text-owner-name">
                Chris C. - Master Electrician
              </p>
              
              <p className="text-blue-100/80 text-lg max-w-xl mb-8">
                Professional electrical services for residential and commercial properties throughout Houston, Texas. Quality workmanship you can trust.
              </p>

              {/* Quick Features */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
                  >
                    <feature.icon className="h-4 w-4 text-yellow-400" />
                    <span className="text-white text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Button 
                  size="lg" 
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-semibold gap-2"
                  asChild
                >
                  <a href="tel:361-404-1267" data-testid="button-call-hero">
                    <Phone className="h-5 w-5" />
                    Call 361-404-1267
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 gap-2"
                  asChild
                >
                  <a href="#contact" data-testid="button-get-quote">
                    <Calendar className="h-5 w-5" />
                    Get Free Quote
                  </a>
                </Button>
              </div>
            </div>

            {/* Logo/Lightbulb */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-8 shadow-2xl border-8 border-yellow-400/50">
                  <img 
                    src={tgeLogo} 
                    alt="T.G.E. Electrical" 
                    className="h-32 w-32 md:h-40 md:w-40"
                    data-testid="img-logo"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-muted/50 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3 w-3 mr-1" />
              Professional Services
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-services-title">
              Our Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From residential installations to commercial repairs, we provide comprehensive electrical services to meet all your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card 
                key={index}
                className="group hover-elevate border-t-4 border-t-blue-600 bg-card"
                data-testid={`card-service-${index}`}
              >
                <CardContent className="pt-8 pb-6">
                  <div className="h-14 w-14 rounded-xl bg-blue-600/10 flex items-center justify-center mb-5 group-hover:bg-blue-600/20 transition-colors">
                    <service.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Services */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Panel Upgrades",
              "Outlet Installation",
              "Ceiling Fans",
              "EV Chargers",
              "Generator Install",
              "Code Corrections",
              "Surge Protection",
              "Smart Home Wiring",
            ].map((service, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg bg-card border"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-yellow-400/10 text-yellow-600 border-yellow-400/20">
                <Star className="h-3 w-3 mr-1" />
                Why Choose Us
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Houston's Trusted Electrical Experts
              </h2>
              <p className="text-muted-foreground mb-8">
                With years of experience serving the Houston area, T.G.E. Electrical Company has built a reputation for excellence, reliability, and exceptional customer service. Our licensed master electrician ensures every job meets the highest standards.
              </p>

              <div className="space-y-4">
                {[
                  { title: "Licensed Master Electrician", desc: "Texas License #750779 - Fully bonded and insured" },
                  { title: "Quality Workmanship", desc: "We stand behind every project with our satisfaction guarantee" },
                  { title: "Transparent Pricing", desc: "Honest, upfront quotes with no hidden fees or surprises" },
                  { title: "Fast Response Time", desc: "Same-day service available for urgent electrical needs" },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-yellow-400/20 rounded-3xl blur-3xl" />
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Free Estimate</h3>
                      <p className="text-muted-foreground">No obligation quote</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Get a detailed, no-obligation estimate for your electrical project. We'll assess your needs and provide transparent pricing.
                  </p>
                  <Button className="w-full gap-2" size="lg" asChild>
                    <a href="tel:361-404-1267">
                      <Phone className="h-5 w-5" />
                      Call For Free Estimate
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-contact-title">
              Get In Touch
            </h2>
            <p className="text-blue-200 max-w-2xl mx-auto">
              Ready to start your electrical project? Contact us today for a free consultation and estimate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone */}
            <a 
              href="tel:361-404-1267"
              className="group"
              data-testid="card-contact-phone"
            >
              <Card className="h-full bg-blue-900/50 border-blue-700/50 backdrop-blur-sm hover:bg-blue-900/70 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-400/30 transition-colors">
                    <Phone className="h-7 w-7 text-yellow-400" />
                  </div>
                  <p className="text-blue-200 text-lg mb-2">Call Us</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">361-404-1267</p>
                </CardContent>
              </Card>
            </a>

            {/* Email */}
            <a 
              href="mailto:TGEBilling@gmail.com"
              className="group"
              data-testid="card-contact-email"
            >
              <Card className="h-full bg-blue-900/50 border-blue-700/50 backdrop-blur-sm hover:bg-blue-900/70 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-400/30 transition-colors">
                    <Mail className="h-7 w-7 text-yellow-400" />
                  </div>
                  <p className="text-blue-200 text-lg mb-2">Email Us</p>
                  <p className="text-lg md:text-xl font-bold text-white break-all">TGEBilling@gmail.com</p>
                </CardContent>
              </Card>
            </a>

            {/* Address */}
            <div className="group" data-testid="card-contact-address">
              <Card className="h-full bg-blue-900/50 border-blue-700/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-7 w-7 text-yellow-400" />
                  </div>
                  <p className="text-blue-200 text-lg mb-2">Visit Us</p>
                  <p className="text-lg font-bold text-white">
                    8405 Wilcrest DR B<br />
                    Houston, TX 77072
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Review Links */}
          <div className="mt-12 text-center">
            <p className="text-blue-200 mb-4">See what our customers are saying</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 gap-2"
                asChild
              >
                <a 
                  href="https://www.yelp.com/biz/gentlemens-electric-sugar-land-4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="link-yelp"
                >
                  <SiYelp className="h-5 w-5" />
                  View on Yelp
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950 text-center py-8 px-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src={tgeLogo} alt="T.G.E." className="h-8 w-8" />
          <span className="text-white font-semibold">T.G.E. Electrical Company</span>
        </div>
        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} T.G.E. Electrical Company. All rights reserved.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Chris C. - Master Electrician | Texas License #750779
        </p>
      </div>
    </div>
  );
}
