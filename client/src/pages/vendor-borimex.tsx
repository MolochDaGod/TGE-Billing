import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, Building2, Home, Phone, Mail, Award, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function VendorBorimex() {
  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" asChild data-testid="button-back-vendors">
        <Link href="/vendors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Link>
      </Button>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 md:p-12">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
              <Wind className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Bori Mex Services</h1>
              <p className="text-blue-100 text-lg">Your Trusted HVAC Partner</p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-medium max-w-3xl">
            Reliable HVAC Solutions - Commercial & New Home Specialists
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-orange-500 text-white border-0">
              <Award className="h-3 w-3 mr-1" />
              EPA Universal Approved
            </Badge>
            <Badge variant="secondary" className="bg-orange-500 text-white border-0">
              <Award className="h-3 w-3 mr-1" />
              Licensed Professionals
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <Card data-testid="card-contact">
        <CardHeader>
          <CardTitle className="text-2xl">Get in Touch</CardTitle>
          <CardDescription>Contact Caesar Rivera for your HVAC needs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a 
                    href="tel:346-733-4065" 
                    className="text-lg font-semibold text-primary hover:underline"
                    data-testid="link-phone"
                  >
                    346-733-4065
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a 
                    href="mailto:Borimexservices@gmail.com" 
                    className="text-lg font-semibold text-primary hover:underline break-all"
                    data-testid="link-email"
                  >
                    Borimexservices@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <span className="text-5xl font-bold">CR</span>
                </div>
                <p className="font-semibold text-lg">Caesar Rivera</p>
                <p className="text-sm text-muted-foreground">HVAC Professional</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              size="lg" 
              asChild 
              className="flex-1"
              data-testid="button-call-now"
            >
              <a href="tel:346-733-4065">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="flex-1"
              data-testid="button-email"
            >
              <a href="mailto:Borimexservices@gmail.com">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Our Services</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover-elevate" data-testid="card-service-commercial">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Commercial HVAC</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Expert solutions for businesses, ensuring optimal climate control and energy efficiency for commercial spaces of all sizes.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Business climate control systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Energy-efficient solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Commercial space optimization</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-service-residential">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Home className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">New Home HVAC Installation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Professional installation services for new constructions, providing reliable and efficient heating and cooling systems from the ground up.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Complete system installation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">New construction expertise</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Reliable heating & cooling</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Certifications */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20" data-testid="card-certifications">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-yellow-600" />
            Certifications & Qualifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <CheckCircle2 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">EPA Universal Approved</p>
                <p className="text-sm text-muted-foreground">Certified refrigerant handling</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <CheckCircle2 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">Licensed Professionals</p>
                <p className="text-sm text-muted-foreground">Fully licensed HVAC technicians</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0" data-testid="card-cta">
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-3xl font-bold">Ready to Get Started?</h3>
          <p className="text-xl text-blue-100">
            Contact us today for professional HVAC solutions tailored to your needs.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            asChild
            className="bg-orange-500 hover:bg-orange-600 text-white border-0"
            data-testid="button-cta-call"
          >
            <a href="tel:346-733-4065">
              <Phone className="h-5 w-5 mr-2" />
              Call 346-733-4065
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
