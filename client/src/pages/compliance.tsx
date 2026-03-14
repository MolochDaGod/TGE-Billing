import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, FileText, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Plus, Download, CheckIcon } from "lucide-react";

export default function Compliance() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-compliance-title">
          <Shield className="h-8 w-8 text-primary" />
          TDLR & NEC Compliance
        </h1>
        <p className="text-muted-foreground" data-testid="text-compliance-subtitle">
          T.G.E. Billing - Texas Master Class Electrician License #750779
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-permits-summary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Permits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Active insurance certificate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-inspections-summary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-compliance-summary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NEC Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              All jobs NEC 2023 compliant
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insurance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insurance" data-testid="tab-insurance">
            <Shield className="h-4 w-4 mr-2" />
            Insurance & Certificates
          </TabsTrigger>
          <TabsTrigger value="permits" data-testid="tab-permits">
            <FileText className="h-4 w-4 mr-2" />
            Permits
          </TabsTrigger>
          <TabsTrigger value="inspections" data-testid="tab-inspections">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="work-orders" data-testid="tab-work-orders">
            <FileText className="h-4 w-4 mr-2" />
            Work Orders
          </TabsTrigger>
          <TabsTrigger value="standards" data-testid="tab-standards">
            <Shield className="h-4 w-4 mr-2" />
            TDLR/NEC Standards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insurance" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Insurance & Certificates</h2>
              <p className="text-sm text-muted-foreground">Business liability coverage and compliance certificates</p>
            </div>
          </div>

          <Card data-testid="card-coi-insurance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  Certificate of Liability Insurance (COI)
                </CardTitle>
                <CardDescription>Commercial General Liability & Contractors E&O Coverage</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Active
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Coverage Details</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Issuer:</strong> Next First Insurance Agency, Inc.</p>
                    <p><strong>Certificate #:</strong> 162444204</p>
                    <p><strong>Insured:</strong> Christopher Collins, T.G.E. (Master Electrician #750779)</p>
                    <p><strong>Certificate Holder:</strong> The Willowick</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Coverage Limits</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>General Liability:</strong> $1,000,000 each occurrence / $1,000,000 aggregate</p>
                    <p><strong>Errors & Omissions:</strong> $10,000 each / $20,000 aggregate</p>
                    <p><strong>Valid:</strong> 11/04/2025 - 11/04/2026</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <a 
                  href="/attached_assets/COI%20willowick_1763855763050.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  download="COI_willowick_1763855763050.pdf"
                >
                  <Button variant="outline" data-testid="button-download-coi">
                    <Download className="h-4 w-4 mr-2" />
                    Download Insurance Certificate PDF
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                Insurance Requirements for Texas Electricians
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>General Liability Insurance:</strong> Protects against third-party bodily injury and property damage claims. Recommended minimum $1M per occurrence.</p>
              <p><strong>Contractors Errors & Omissions:</strong> Covers professional liability for design errors, omissions, or negligence in electrical work.</p>
              <p><strong>Coverage Requirements:</strong> T.G.E. Billing maintains active coverage that includes The Willowick as additional insured for all electrical service operations in Texas.</p>
              <p><strong>Validity:</strong> Certificate is valid for electrical work operations and covers all residential and commercial installations within Texas jurisdiction.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permits" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Electrical Permits</h2>
              <p className="text-sm text-muted-foreground">Manage TDLR-compliant electrical permit applications</p>
            </div>
            <Button data-testid="button-new-permit">
              <Plus className="h-4 w-4 mr-2" />
              New Permit Application
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Permit Applications</CardTitle>
              <CardDescription>Track status of permit applications and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No permit applications yet</p>
                <p className="text-sm mt-2">Create your first permit application to get started</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                TDLR Permit Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Required for:</strong> All electrical installations, alterations, and repairs requiring inspection</p>
              <p><strong>License Number:</strong> Must include Master Electrician License #750779</p>
              <p><strong>Jurisdiction:</strong> City/County electrical inspector authority</p>
              <p><strong>Fees:</strong> Vary by project scope and jurisdiction</p>
              <p><strong>Timeline:</strong> Apply before work begins, valid for duration specified by jurisdiction</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Electrical Inspections</h2>
              <p className="text-sm text-muted-foreground">Schedule and track NEC code compliance inspections</p>
            </div>
            <Button data-testid="button-schedule-inspection">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Inspections</CardTitle>
              <CardDescription>Scheduled electrical inspections and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No inspections scheduled</p>
                <p className="text-sm mt-2">Schedule your first inspection</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Common Inspection Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Badge variant="outline" className="justify-start">Rough-in Inspection</Badge>
                <Badge variant="outline" className="justify-start">Final Inspection</Badge>
                <Badge variant="outline" className="justify-start">Service Equipment Inspection</Badge>
                <Badge variant="outline" className="justify-start">Temporary Service Inspection</Badge>
                <Badge variant="outline" className="justify-start">Re-inspection (after corrections)</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Work Orders</h2>
              <p className="text-sm text-muted-foreground">Detailed documentation of electrical work performed</p>
            </div>
            <Button data-testid="button-new-work-order">
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Work Orders</CardTitle>
              <CardDescription>Track work orders with NEC compliance documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No work orders yet</p>
                <p className="text-sm mt-2">Create a work order for your next job</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Work Order Documentation Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Scope of Work:</strong> Detailed description of electrical work performed</p>
              <p><strong>NEC Compliance:</strong> Reference to applicable NEC 2023 articles</p>
              <p><strong>Materials:</strong> List of all electrical materials and equipment used</p>
              <p><strong>Testing:</strong> Results of electrical tests (continuity, voltage, GFCI, etc.)</p>
              <p><strong>Safety:</strong> Safety measures and protocols followed</p>
              <p><strong>Photos:</strong> Before/during/after photos of installation</p>
              <p><strong>Signatures:</strong> Customer and technician sign-off</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <h2 className="text-2xl font-semibold">TDLR & NEC Standards Reference</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  TDLR Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">Texas Department of Licensing and Regulation</p>
                  <p className="text-muted-foreground">Governing body for electrical contractors in Texas</p>
                </div>
                <div className="space-y-2">
                  <p><strong>License Type:</strong> Master Electrician</p>
                  <p><strong>License Number:</strong> #750779</p>
                  <p><strong>Company:</strong> T.G.E. Billing</p>
                  <p><strong>Jurisdiction:</strong> State of Texas</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="font-semibold mb-2">Key Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Obtain permits before electrical work</li>
                    <li>Licensed electrician on all jobs</li>
                    <li>Pass required inspections</li>
                    <li>Maintain insurance and bonds</li>
                    <li>Follow NEC standards</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  NEC 2023 Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">National Electrical Code (NEC)</p>
                  <p className="text-muted-foreground">NFPA 70 - 2023 Edition</p>
                </div>
                <div className="pt-2">
                  <p className="font-semibold mb-2">Critical Articles (Commonly Referenced):</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Article 110 - General Requirements</li>
                    <li>Article 210 - Branch Circuits</li>
                    <li>Article 220 - Branch-Circuit, Feeder Calculations</li>
                    <li>Article 230 - Services</li>
                    <li>Article 250 - Grounding and Bonding</li>
                    <li>Article 310 - Conductors</li>
                    <li>Article 314 - Outlet, Device, Junction Boxes</li>
                    <li>Article 334 - Non-Metallic Sheathed Cable</li>
                    <li>Article 406 - Receptacles</li>
                    <li>Article 408 - Panelboards</li>
                    <li>Article 422 - Appliances</li>
                    <li>Article 430 - Motors</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Safety & Ethics Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">T.G.E. Billing is committed to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>100% compliance with TDLR regulations and NEC 2023 standards</li>
                <li>Ethical business practices and transparent customer communication</li>
                <li>Safety-first approach on all electrical installations and repairs</li>
                <li>Proper permitting and inspection for all applicable work</li>
                <li>Continuing education to stay current with code updates</li>
                <li>Professional documentation of all electrical work performed</li>
                <li>Customer satisfaction and quality workmanship</li>
              </ul>
              <p className="pt-3 italic text-muted-foreground">
                "We make power easy" - while maintaining the highest standards of safety and compliance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
