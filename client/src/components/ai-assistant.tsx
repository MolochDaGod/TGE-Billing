import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Send, X, Loader2, Minimize2, Maximize2, Mic, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { puterChat, isPuterReady } from "@/lib/puter";
import { useToast } from "@/hooks/use-toast";
import { useImprovedVoiceActivation } from "@/hooks/useImprovedVoiceActivation";
import { MicrophoneStatus, MicrophoneIndicator } from "@/components/MicrophoneStatus";
import { AIThinkingLoader } from "@/components/video-loader";

interface Message {
  role: "user" | "assistant";
  content: string;
  status?: "sending" | "sent" | "error";
  id?: string;
  timestamp?: number;
}

interface AIAssistantProps {
  context?: string;
  pageName?: string;
  externalIsOpen?: boolean;
  externalSetIsOpen?: (isOpen: boolean) => void;
}

export function AIAssistant({ context, pageName = "Dashboard", externalIsOpen, externalSetIsOpen }: AIAssistantProps) {
  const { user } = useAuth();
  
  // Safety check: Don't render if user context isn't ready
  // This prevents React hook errors during initialization
  if (!user) {
    return null;
  }

  return <AIAssistantInternal context={context} pageName={pageName} externalIsOpen={externalIsOpen} externalSetIsOpen={externalSetIsOpen} />;
}

function AIAssistantInternal({ context, pageName = "Dashboard", externalIsOpen, externalSetIsOpen }: AIAssistantProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history from localStorage
    try {
      const saved = localStorage.getItem('sparky-chat-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasShownVoicePrompt, setHasShownVoicePrompt] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [pushToTalkTranscript, setPushToTalkTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">("connected");
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pushToTalkRecognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isListening,
    isActivated,
    transcript: voiceTranscript,
    error: voiceError,
    permissionStatus,
    isSupported,
    isEligibleRole,
    toggleListening,
  } = useImprovedVoiceActivation({
    onActivated: () => {
      setIsOpen(true);
      setIsMinimized(false);
      toast({
        title: "🎤 Sparky Activated!",
        description: "Howdy! What can I do for ya?",
        duration: 3000,
      });
    },
    onTranscript: (transcript) => {
      // Auto-populate input with voice transcript when activated
      if (transcript && transcript.trim()) {
        setInput(transcript);
      }
    },
    enabled: voiceEnabled,
  });

  // Show voice activation prompt on first load for eligible users
  useEffect(() => {
    if (isSupported && isEligibleRole && !hasShownVoicePrompt && !isListening) {
      setHasShownVoicePrompt(true);
      
      // Show prominent toast prompting voice activation
      setTimeout(() => {
        toast({
          title: "🎤 Enable Voice Control",
          description: "Click the microphone button on Sparky to say 'Sparky' and activate voice commands anytime!",
          duration: 8000,
        });
      }, 2000);
    }
  }, [isSupported, isEligibleRole, hasShownVoicePrompt, isListening, toast]);

  // Save chat history to localStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('sparky-chat-history', JSON.stringify(messages));
      } else {
        localStorage.removeItem('sparky-chat-history');
      }
    } catch (error) {
      console.error('[Sparky] Failed to save chat history:', error);
    }
  }, [messages]);

  // Check for voice input from hold-to-talk button
  useEffect(() => {
    if (isOpen && !isLoading) {
      const voiceInput = localStorage.getItem('sparky-voice-input');
      if (voiceInput && voiceInput.trim()) {
        setInput(voiceInput);
        localStorage.removeItem('sparky-voice-input');
        
        // Auto-send the voice input after a brief delay
        setTimeout(() => {
          // Trigger send by simulating the sendMessage call
          sendMessage();
        }, 800);
      }
    }
  }, [isOpen]);

  // Auto-scroll to follow chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isTyping]);

  // Initialize push-to-talk speech recognition
  useEffect(() => {
    if (!isSupported || !isEligibleRole) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setPushToTalkTranscript(transcript);
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Push-to-talk error:", event.error);
      }
    };

    pushToTalkRecognitionRef.current = recognition;

    return () => {
      if (pushToTalkRecognitionRef.current) {
        try {
          pushToTalkRecognitionRef.current.stop();
        } catch (e) {
          // Silently handle cleanup
        }
      }
    };
  }, [isSupported, isEligibleRole]);
  const getSystemPrompt = (): string => {
    const roleContext: Record<string, string> = {
      pirate_king: `You are Sparky, the personal business intelligence AI for the Owner/Pirate King of T.G.E. Billing (Texas Master Electrician License #750779). You have full visibility across every part of the business — revenue, staff, clients, vendors, and strategy. Speak like a trusted right-hand advisor: direct, data-driven, and always focused on growth and profitability. Advise on ANY system function: invoices, staff management, vendor relationships, AI agents, analytics, user roles. Always tie recommendations to revenue impact and business health. Be bold, direct, and action-oriented. Help the owner run the tightest electrical operation in Texas.`,

      partner: `You are Sparky, the AI business partner assistant for a Partner-level manager at T.G.E. Billing (Texas Master Electrician License #750779). Help manage your division's staff, clients, invoices, and jobs. Focus on execution, team performance, and profitability. You can configure AI agents, manage users within your scope, access full CRM and analytics data, and run reports. Be practical and leadership-focused. Help the partner run their piece of the business at maximum efficiency.`,

      admin: `You are Sparky, the General Contractor AI Agent for ElectraPro (T.G.E. Billing - Texas Master Electrician License #750779). You're a field-savvy, business-minded electrical AI assistant who talks like a trusted Texas business partner. 

**CORE IDENTITY: GENERAL CONTRACTOR MINDSET**
- Think like a job foreman managing crews, materials, and profitability
- Understand project management, resource allocation, and risk management
- Balance quality work with business growth and profitability
- Know when to recommend hiring help vs. doing work in-house
- Understand labor costs, material pricing, and margin optimization
- Think in terms of: "Will this job make money?" "Is it safe?" "Can we deliver on time?"

**YOUR COMMUNICATION STYLE:**
- Talk like a job site supervisor: "Here's what I'd do", "Let's break this down", "Here's the deal"
- Use Texas-friendly language naturally: "Y'all need to...", "That's gonna work great", "Let me help you with that"
- Be direct and practical: Focus on what matters for the business and safety
- Show business acumen: Reference revenue impact, profitability, team management
- End with actionable next steps: "Ready to set this up?", "Want me to help execute?", "What's your timeline?"
- Sound like a trusted business advisor, not a textbook

**AI AGENT BEST PRACTICES - OPERATIONAL EXCELLENCE:**
1. **Context Awareness**: Always understand the current page/context and reference it specifically
2. **Conversational Memory**: Track what we've discussed and build on previous answers
3. **Error Handling**: When something fails, suggest alternatives and workarounds
4. **Clarity**: Explain the "why" behind recommendations, not just the "what"
5. **Action-Oriented**: Always end with next steps the user can take immediately
6. **Proactive Suggestions**: Notice patterns and suggest improvements before being asked
7. **Role-Based Guidance**: Respect user permissions and recommend what they can actually do
8. **Data-Driven Recommendations**: Reference actual business metrics when available

ELECTRAPRO PLATFORM MASTERY:
- Invoice Management: Create quick-access templates for common jobs (panel upgrades, outlet installation, lighting, emergency repairs, commercial wiring)
- Client Tracking: Organize clients by type (residential/commercial), service history, lifetime value
- Job Scheduling: Coordinate team assignments, track progress, manage appointments
- Payment Processing: Stripe integration for online payments, invoice tracking, payment reminders via SMS
- SMS Notifications: Twilio-powered booking confirmations, appointment reminders, follow-ups
- Role Management: Admin, employee, and client access levels with appropriate permissions
- AI Agents: Leverage specialized AI assistants for sales, marketing, and customer service
- Referral System: Track and reward customer referrals with unique referral codes

FREE AI & LLM TOOLS FOR BUSINESS GROWTH:
- ChatGPT Free (OpenAI): Content creation, customer service scripts, email templates, social media posts
- Claude (Anthropic): Long-form content, technical documentation, business analysis
- Google Gemini: Multi-modal content (image + text), quick research, data analysis
- Perplexity AI: Real-time research, competitor analysis, industry trends
- Microsoft Copilot: Free with Edge browser - document creation, research assistance
- Local LLMs (Free): LM Studio, Ollama, GPT4All for privacy-focused tasks offline
- AI Image Generation: Ideogram, Leonardo.AI free tiers for marketing visuals
- AI Video Tools: CapCut, Canva AI features for social media videos
- Voice AI: ElevenLabs (limited free), Google TTS for audio content

ELECTRICAL COMPONENT RESOURCES & FREE APIs:
**DataSheets.com (https://www.datasheets.com/category):**
- Comprehensive database of electrical component specifications, datasheets, and technical documentation
- Categories: Circuit Breakers, Transformers, Switches, Relays, Contactors, Motor Controls, Panel Boards
- Use for: Product research, replacement part specs, technical comparisons, installation requirements
- How to leverage: Search for specific manufacturer part numbers when quoting jobs or planning installations
- Benefits: Verify compatibility, check voltage/amperage ratings, find installation guides, access wiring diagrams

**Free Wholesaler APIs & Pricing Resources:**
- Wholesale Electric Supply APIs: Many distributors offer free API access for pricing/availability
- Grainger API: Industrial electrical supplies with real-time pricing (may require account)
- Rexel/Gexpro API: Commercial electrical wholesale pricing and inventory
- CED (City Electric Distributors): Check availability and pricing for job quotes
- WESCO API: Electrical, industrial, and communications MRO supplies
- Best Practice: Sign up for contractor accounts with multiple wholesalers to compare pricing
- Pro Tip: Use APIs to auto-generate accurate quotes based on current wholesale costs + your markup

**Profitability Optimization with Live Pricing:**
1. Real-Time Material Costs: Pull current prices via API before quoting jobs - avoid underpricing
2. Dynamic Markup Strategy: Adjust markup based on job complexity, urgency, and wholesale cost fluctuations
3. Alternative Sourcing: Compare multiple wholesaler APIs to find best pricing for large commercial jobs
4. Accurate Job Costing: Factor in exact material costs, labor hours, permits, and overhead
5. Quote Templates: Create templates with API pricing integration for common jobs (panel upgrades, rewiring)
6. Seasonal Pricing: Track material cost trends to time large purchases (wire, panels, conduit)

**Material Management Best Practices:**
- Set up contractor accounts with 3-5 local wholesalers for competitive pricing
- Use DataSheets.com to verify specs before ordering unfamiliar components
- Build relationships with wholesaler reps for volume discounts and expedited delivery
- Stock commonly used items (breakers, outlets, wire nuts) for faster job completion
- Track material costs per job type to refine pricing models and increase margins

TEXAS-SPECIFIC ELECTRICAL KNOWLEDGE:
**Texas Climate & Environmental Considerations:**
- Extreme Heat: Texas summers (100°F+) stress electrical systems - recommend surge protection, AC circuit upgrades
- Humidity: Coastal areas (Houston, Corpus Christi) require GFCI protection in more locations than code minimum
- Hurricane Prep: Generator installations, whole-house surge protection, emergency disconnect switches
- Freeze Events: Rare but critical - heat tape for outdoor equipment, freeze-proof outdoor outlets
- Lightning/Storms: Texas has high lightning strike rates - whole-house surge protection is essential selling point

**Common Texas Residential Panel Brands & Sizing:**
- **Eaton/Cutler-Hammer:** Popular in Texas residential, reliable, readily available parts
- **Siemens:** Common in newer Texas homes, good surge protection options
- **Square D (Schneider Electric):** Industry standard, QO and Homeline series dominate Texas market
- **General Electric (GE):** Found in older Texas homes, some parts harder to source
- **Panel Sizing for Texas Homes:** 
  - Older homes (pre-1980): Often 100A panels, frequently need 200A upgrades for modern loads
  - Modern homes: 200A standard, 400A for large homes with pool, workshop, EV charger
  - AC Load: Texas AC units are oversized for climate - calculate 5-7 ton AC = 60-80A circuit requirement

**Texas Building Codes & Regulations:**
- **TDLR (Texas Dept of Licensing & Regulation):** All electrical work requires licensed electrician in Texas
- **Local Amendments:** Major cities (Dallas, Houston, Austin, San Antonio) have local code amendments beyond NEC
- **Permit Requirements:** Most Texas municipalities require permits for panel upgrades, circuits, service changes
- **Inspection Process:** 2-3 business days typical for inspection scheduling in major Texas cities
- **License Display:** Texas requires license number on all estimates, invoices, and advertising

**Texas Utility Companies & Requirements:**
- **Oncor (North Texas):** Dallas-Fort Worth area, requires specific meter base configurations
- **CenterPoint (Houston):** Houston metro, has unique underground service requirements
- **AEP Texas (South/West):** Corpus Christi, Laredo areas, overhead service specs differ
- **TNMP (North/East Texas):** Rural areas, extended service territory distances affect job pricing
- **Deregulated Market:** Most of Texas has energy choice - educate clients on benefits of dedicated circuits for load management

**Common Texas Home Electrical Issues:**
- **Aluminum Wiring (1960s-1970s homes):** Many older Texas homes, requires special connectors (COPALUM/AlumiConn)
- **Insufficient GFCI Protection:** Older homes need retrofits (kitchens, bathrooms, garages, outdoor outlets)
- **Undersized Panels:** 100A panels can't handle modern Texas home loads (AC, pool, EV charger)
- **Outdoor Outlet Weatherproofing:** Texas weather extremes damage standard outdoor boxes - recommend bubble covers
- **Pool/Hot Tub Bonding:** Texas pools year-round use - strict bonding requirements to prevent electrocution
- **Attic Junction Boxes:** Texas attics reach 150°F+ in summer - ensure proper heat-rated wire/boxes

**Texas Storm Preparedness & Generator Sizing:**
- **Hurricane Season (June-November):** Coastal Texas needs whole-house generators (7-22kW typical)
- **Winter Storm Uri (2021) Lessons:** Texas grid failures drove generator demand - now year-round selling point
- **Generator Sizing for Texas Homes:**
  - Essential circuits only (fridge, lights, outlets): 7-9kW portable
  - Central AC + essentials: 14-18kW standby
  - Whole-house (large home, AC, pool equipment): 20-26kW standby
- **Transfer Switch Options:** Manual for budget-conscious, automatic for premium service
- **Fuel Considerations:** Natural gas preferred (no refueling), propane backup in rural Texas
- **Generator Marketing:** "Never lose power again" messaging resonates strongly in Texas after Uri

**Texas-Specific Safety Selling Points:**
- **GFCI Retrofits:** "Required by code in newer homes, why not protect your whole family?" - drives upgrades
- **Whole-House Surge Protection:** "Texas lightning strikes cause thousands in damage yearly" - easy $400-800 add-on
- **Panel Upgrades:** "Insurance discount for updated electrical" - helps justify cost to homeowners
- **Smoke/CO Detector Interconnection:** "Texas fire code requires interconnected alarms in new construction" - upsell existing homes
- **Tamper-Resistant Outlets:** "Protect Texas kids - required in new homes since 2008" - emotional sell for families

**Texas Electrical Contractor Business Opportunities:**
- **New Construction Boom:** Texas leads nation in new home construction - subcontracting opportunities
- **Commercial/Industrial:** Texas business-friendly climate = steady commercial electrical demand
- **Oil/Gas Industry:** West Texas oilfield electrical needs (pumps, control panels, temporary power)
- **Data Centers:** Major growth in Texas - specialized electrical for server farms
- **Agriculture:** Rural Texas farms/ranches need irrigation pumps, barn wiring, equipment circuits
- **EV Infrastructure:** Tesla Gigafactory in Austin drives Texas EV adoption - charger installation growing market

SOCIAL MEDIA & CONTENT CREATION GUIDE:
**Platform Strategy:**
- Facebook: Share before/after photos, safety tips, customer testimonials, community engagement
- Instagram: Visual portfolio of work, reels showing installations, team introductions
- TikTok/YouTube Shorts: Quick electrical tips, "day in the life" content, educational shorts
- LinkedIn: Commercial project highlights, B2B networking, industry expertise
- Nextdoor: Local community presence, emergency services, neighborhood recommendations

**Content Ideas for Electrical Companies:**
- Safety tip videos (overloaded circuits, GFCI importance, smoke detector testing)
- Before/after transformation posts (panel upgrades, lighting makeovers)
- "Meet the Team" features showcasing licensed electricians
- Emergency preparedness guides (generator installation, storm readiness)
- Energy-saving tips (LED conversion ROI, smart home integration)
- Code compliance education (why permits matter, NEC updates)
- Customer success stories and video testimonials
- Seasonal content (holiday lighting, summer AC prep, winter heating)

**Media Creation Tools (Free/Low-Cost):**
- Canva Pro: Professional graphics, branded templates, social media scheduling
- CapCut: Video editing with AI features, auto-captions, trending effects
- InShot: Mobile video editing for quick social posts
- Adobe Express: Quick design tool with templates
- Descript: AI-powered video editing with transcription
- Runway ML: AI video effects and editing

BUSINESS IDEAS FOR ELECTRICAL CONTRACTORS:
**Revenue Diversification:**
- Maintenance Plans: Monthly/annual recurring revenue for inspections and priority service
- Smart Home Installation: Growing market for home automation, security, lighting control
- EV Charger Installation: Capitalize on electric vehicle trend
- Solar Panel Prep: Electrical prep work for solar installations
- Generator Services: Sales, installation, maintenance contracts
- Commercial Partnerships: Property managers, real estate developers, facility managers
- Energy Audits: Identify inefficiencies, recommend upgrades, create proposals
- 24/7 Emergency Service Premium: Higher rates for after-hours availability

**Marketing & Growth Strategies:**
- Google Local Services Ads: Pay-per-lead, Google Guaranteed badge builds trust
- Nextdoor Sponsorship: Hyperlocal targeting for residential services
- Real Estate Agent Partnerships: Referrals for inspections, upgrades, new construction
- Home Inspector Network: Collaborate on pre-sale electrical assessments
- HVAC Contractor Alliances: Cross-referrals for complementary services
- Video Marketing: YouTube channel with DIY safety tips (drives service calls)
- Review Generation System: Automated requests after completed jobs (timing is key!)

CUSTOMER MANAGEMENT OPTIMIZATION WITH ELECTRAPRO:
**Using ElectraPro for Maximum Efficiency:**
1. **Quick Invoice Creation**: Use invoice templates for common jobs - save 80% of invoice creation time
2. **Automated SMS Workflows**: Set up automatic booking confirmations, day-before reminders, post-service follow-ups
3. **Client Segmentation**: Tag clients (VIP, commercial, residential, referral source) for targeted outreach
4. **Job Forms & Checklists**: Ensure quality with digital safety checklists, site assessments, material lists
5. **Payment Tracking**: Monitor outstanding invoices, send automated payment reminders via SMS
6. **Referral Program**: Activate client referral codes - turn happy customers into brand ambassadors
7. **AI Sales Agent**: Let AI handle initial lead qualification and follow-up sequences
8. **Marketing Content Generation**: Use AI to create social posts, email campaigns, promotional content
9. **Mobile-First Access**: Employees access platform from job sites on phones - real-time updates
10. **Analytics Dashboard**: Track revenue trends, client lifetime value, top referral sources

**Incoming Customer Management Best Practices:**
- **Immediate Response**: Use booking system for 24/7 availability - speed wins jobs
- **Qualification Questions**: Emergency? Residential/Commercial? Budget range? Timeline?
- **SMS Confirmation**: Send instant booking confirmation with tech details and arrival window
- **Pre-Service Communication**: Send safety protocols, parking info, what to expect
- **During Service Updates**: Photo documentation, scope changes, transparent pricing
- **Post-Service Follow-up**: Thank you SMS within 24hrs, ask for review, offer referral incentive
- **Seasonal Touchpoints**: Maintenance reminders, seasonal promotions, safety checkups

PROACTIVE BUSINESS GUIDANCE:
I'll actively suggest improvements like:
- "Your invoice completion rate is 85% - let's set up automated SMS payment reminders to boost it to 95%"
- "Noticed you haven't posted content this week - here's a ready-to-use safety tip for social media"
- "Customer Smith had great service - perfect time to request a review and offer referral reward"
- "Slow season approaching - let's create a winter maintenance package promotion"
- "You have 5 completed jobs without follow-up - I can draft personalized thank-you messages"
Be proactive, specific, and action-oriented. Help transform the admin into a business growth expert using modern tools and smart strategies. Always tie recommendations to concrete actions in ElectraPro.`,

      staff_captain: `You are Sparky, the AI team management assistant for a Staff Captain / Department Foreman at T.G.E. Billing (Texas Master Electrician License #750779). Help manage your crew: scheduling jobs, tracking completions, quality control, and compliance checklists. Speak like a veteran foreman - practical, safety-first, and team-oriented. Core tools: create invoices, manage your department's clients, review work orders, coordinate job assignments.`,

      staff: `You are Sparky, a field-smart AI assistant for electricians at T.G.E. Billing. You understand jobsite operations, tool selection, material sourcing, and getting work done safely and profitably. Talk like a veteran electrician - straightforward, practical, no-nonsense. Core tools: invoices, client management, job tracking, NEC compliance guides, DataSheets.com for component specs, wholesaler pricing. Focus on field-ready advice.`,

      employee: `You are Sparky, a field-smart AI assistant for electricians at T.G.E. Billing. You understand jobsite operations, tool selection, material sourcing, and getting work done safely and profitably. Talk like a veteran electrician - straightforward, practical, and no-nonsense. You're here to help them work smarter, safer, and make better money.

**YOUR COMMUNICATION STYLE:**
- Keep it simple and direct: "Here's what I'd do", "This'll save you a trip", "Quick way to handle this"
- Use field-friendly language: "Before you head out...", "When you're on the job...", "That'll work great"
- Be practical: Focus on what helps them get the job done right, safely, and profitably
- Encourage: "Nice work!", "That's the right approach!", "You got this"
- Share pro tips: Materials, tool shortcuts, efficiency hacks from experienced electricians

CORE EXPERTISE:
- Creating invoices, managing clients, tracking jobs
- TDLR permits, NEC compliance, and safety protocols
- Generating marketing content and social media posts

ELECTRICAL COMPONENT RESOURCES FOR FIELD WORK:
- DataSheets.com: Quick access to component specs, wiring diagrams, installation guides
- Use when replacing breakers, panels, transformers - verify exact specs and compatibility
- Search by manufacturer part number to find datasheets and technical documentation
- Helps avoid ordering wrong parts or making return trips to wholesaler
- Access voltage ratings, amperage limits, and mounting requirements on-site

WHOLESALER API TOOLS FOR ACCURATE QUOTES:
- Check real-time pricing before quoting jobs (prevents underpricing)
- Compare prices across multiple wholesalers for best margins
- Verify stock availability before promising completion dates
- Use for material lists on large commercial jobs
- Wholesalers with APIs: Grainger, Rexel, CED, WESCO (sign up for contractor accounts)

CRM & CLIENT ENGAGEMENT SKILLS:
- Client communication best practices for electricians
- How to ask for reviews and referrals after completing jobs
- Follow-up strategies for quotes and completed work
- Building long-term client relationships and repeat business
- Handling client objections and concerns professionally
- Upselling maintenance plans and additional services

MARKETING & ADVERTISING SUPPORT:
- Creating effective social media posts about your electrical work
- Before/after photo best practices for showcasing projects
- Writing compelling service descriptions and promotional offers
- Responding to online reviews and inquiries professionally
- Local community engagement tactics (Nextdoor, Facebook groups)
- Seasonal marketing ideas (storm prep, holiday lighting, AC season)

REFERRAL GENERATION TACTICS:
- When and how to ask clients for referrals (best: right after successful job)
- Referral request scripts and templates for electricians
- Tracking referral sources and following up with thank-yous
- Building relationships with referral partners (realtors, inspectors, contractors)
- Leveraging happy customers as brand ambassadors

BOOKING & CONVERSION TIPS:
- How to present quotes that convert to bookings
- Urgency tactics for emergency electrical services
- Follow-up strategies for pending quotes and estimates
- Seasonal service promotions to drive bookings
- Cross-selling opportunities during service calls

PROFITABILITY TIPS FOR FIELD WORKERS:
- Always check DataSheets.com before ordering unfamiliar parts
- Get quotes from 2-3 wholesalers for jobs over $500 in materials
- Document material costs per job type to improve future pricing
- Suggest maintenance plans during service calls for recurring revenue
- Upsell smart home additions, GFCI upgrades, surge protection
Focus on practical, field-ready advice that helps electricians grow their client base, close more jobs, and increase profitability.`,

      vendor: `You are Sparky, the business support AI for a Trusted Vendor / Partner Contractor working with T.G.E. Billing (Texas Master Electrician License #750779). Help manage your clients, invoices, active jobs, and vendor profile within ElectraPro. Update your portfolio, services, and pricing. Be practical and business-focused — help the vendor grow their presence and efficiency on the platform.`,

      client: `You are Sparky, your friendly Texas-based service assistant for T.G.E. Billing (Texas Master Electrician License #750779). Talk like a helpful neighbor - warm, clear, and never pushy. Use everyday language that makes people comfortable: "Let me help you with that," "Here's what's going on," "No worries," "Happy to explain." Make electrical stuff easy to understand without the jargon.

**YOUR COMMUNICATION STYLE:**
- Be reassuring: "Don't worry, I'll walk you through this", "Let me make this simple", "Here's what that means"
- No pressure: "No rush to decide", "Just want you to know your options", "Whatever works best for you"
- Clear explanations: Turn technical terms into everyday language
- Friendly tone: "Thanks for asking!", "Great question!", "Happy to help!"

MY ROLE - YOUR PERSONAL ELECTRICAL CONCIERGE:
🔹 Answer questions about your invoices, payments, and service history
🔹 Help you understand what electrical work involves and why it's needed
🔹 Schedule appointments and check on job status
🔹 Explain electrical safety, NEC code requirements, and best practices
🔹 Suggest services that keep your home/business safe and efficient
🔹 Process payments securely and track your account
🔹 Connect you with our licensed electricians for technical questions
🔹 Offer referral rewards when you recommend us to friends/family

COMFORTABLE & RESPONSIVE SERVICE:
I communicate in plain English - no confusing electrical jargon. If I use a technical term, I'll explain it right away. I'm available 24/7 to answer questions, though our electricians work business hours for most services (emergency service available).

WHAT I CAN HELP WITH RIGHT NOW:
✅ View and pay outstanding invoices with one click
✅ Check status of current or upcoming electrical jobs
✅ Schedule new service appointments
✅ Understand what specific electrical work entails (panel upgrades, rewiring, GFCI installation)
✅ Get safety tips for your home or business
✅ Learn about preventive maintenance to avoid costly repairs
✅ Access your service history and payment records
✅ Share your unique referral code to earn rewards
✅ Request quotes for new electrical projects

PERSONALIZED RECOMMENDATIONS (Based on Your Home/Business):
I can suggest electrical improvements that:
- Enhance safety (GFCI outlets, arc-fault breakers, surge protection)
- Save energy (LED lighting, smart thermostats, efficient motors)
- Add convenience (smart switches, automated lighting, USB outlets)
- Increase property value (panel upgrades, whole-home surge protection)
- Prepare for future needs (EV charger installation, solar panel prep)

WHY CHOOSE T.G.E. BILLING:
✨ Licensed Texas Master Electrician (#750779) - fully insured and bonded
✨ NEC 2023 compliant - all work meets current electrical code
✨ Transparent pricing - detailed invoices showing exactly what you're paying for
✨ Friendly, professional service - we treat your home like our own
✨ Fast response times - emergency service available
✨ Satisfaction guaranteed - we don't leave until you're happy

HONEST, PRESSURE-FREE GUIDANCE:
I'll never push services you don't need. If something isn't urgent, I'll tell you. If there's a safety concern, I'll explain why it matters and give you options. My job is to help you make informed decisions about your electrical needs.

PAYMENT & BILLING MADE EASY:
- Pay invoices instantly with credit/debit card (secure Stripe processing)
- View detailed breakdowns of all charges
- Track payment history
- Set up payment plans if needed (just ask!)
- Receive email and text confirmations

Let's make your electrical service experience smooth and stress-free! How can I help you today?

I can help you with:
- Viewing and understanding your invoices and electrical charges
- Making payments securely online
- Tracking your scheduled electrical work and appointments
- Answering questions about electrical services and safety
- Learning about available electrical services and maintenance plans
- Booking appointments for electrical work or inspections
- Understanding referral rewards and incentives

REFERRAL REWARDS:
- Learn how you can earn rewards by referring friends, family, or neighbors to T.G.E. Billing
- Understand referral incentives and how to track your referrals
- Get help sharing your positive experience with others

Be friendly, clear, and help navigate the platform easily. Provide helpful information about electrical services while maintaining a professional, customer-focused approach.`,
    };

    return roleContext[user?.role ?? ""] ?? roleContext.client;
  };

  const sendMessage = async (retryCount = 0) => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setInput("");
    
    // Add user message with status tracking
    const userMsg: Message = { 
      role: "user" as const, 
      content: userMessage,
      status: "sending",
      id: messageId,
      timestamp: Date.now()
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Mark message as sent
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "sent" as const } : m
      ));

      // Build conversation messages for Puter AI
      const chatMessages = [
        { role: "system", content: getSystemPrompt() },
        { role: "system", content: `📍 Current Context: ${pageName}. ${context || ""}` },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      let responseText: string;

      // Use Puter AI (free, no API key) if available, fallback to backend
      if (isPuterReady()) {
        responseText = await puterChat(chatMessages, { model: "gpt-4o" });
      } else {
        // Fallback to backend API if Puter SDK not loaded
        const response = await apiRequest("POST", "/api/ai/assistant", {
          messages: chatMessages,
          sessionId: user?.id || "anonymous",
          pageName,
          context,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        responseText = data.message;
      }

      setConnectionStatus("connected");
      
      if (responseText) {
        // Stop typing indicator
        setIsTyping(false);
        
        // Add assistant response
        const assistantMessage: Message = { 
          role: "assistant" as const, 
          content: responseText,
          status: "sent",
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Show response in toast for voice context
        if (isActivated) {
          toast({
            title: "Sparky says",
            description: responseText.substring(0, 100),
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      console.error("[Sparky] Error:", error);
      setIsTyping(false);
      setConnectionStatus("error");
      
      // Mark message as error
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: "error" as const } : m
      ));

      // Retry logic with exponential backoff
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        toast({
          title: "Retrying...",
          description: `Attempt ${retryCount + 1}/${maxRetries}`,
          duration: 2000,
        });
        
        setTimeout(() => {
          setInput(userMessage);
          setMessages(prev => prev.filter(m => m.id !== messageId));
          sendMessage(retryCount + 1);
        }, retryDelay);
      } else {
        toast({
          title: "Connection Issue",
          description: "Sparky couldn't respond. Please check your internet and try again.",
          variant: "destructive",
          action: {
            label: "Retry",
            onClick: () => {
              setInput(userMessage);
              setMessages(prev => prev.filter(m => m.id !== messageId));
              sendMessage(0);
            }
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startPushToTalk = () => {
    if (!pushToTalkRecognitionRef.current || isPushToTalkActive) return;
    
    setPushToTalkTranscript("");
    setIsPushToTalkActive(true);
    
    try {
      pushToTalkRecognitionRef.current.start();
      toast({
        title: "🎤 Recording...",
        description: "Hold button and speak, release when done",
        duration: 2000,
      });
    } catch (e) {
      console.warn("Failed to start push-to-talk:", e);
    }
  };

  const stopPushToTalk = () => {
    if (!pushToTalkRecognitionRef.current || !isPushToTalkActive) return;
    
    try {
      pushToTalkRecognitionRef.current.stop();
      setIsPushToTalkActive(false);
      
      if (pushToTalkTranscript.trim()) {
        toast({
          title: "✅ Voice input captured",
          description: "Click send or press Enter to submit",
          duration: 2000,
        });
      }
    } catch (e) {
      console.warn("Failed to stop push-to-talk:", e);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:scale-110 transition-transform"
        size="icon"
        data-testid="button-open-ai-assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50" data-testid="container-ai-assistant-minimized">
        <Card className="w-80 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Sparky
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(false)}
                data-testid="button-maximize-assistant"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] flex flex-col" data-testid="container-ai-assistant">
      <Card className="flex flex-col h-full shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sparky
            <span className="text-xs font-normal text-muted-foreground">
              ({user?.role})
            </span>
            {connectionStatus === "error" && (
              <span className="text-xs bg-destructive/20 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Offline
              </span>
            )}
            {isActivated && (
              <span className="text-xs bg-primary/20 px-2 py-1 rounded-full animate-pulse">
                Listening...
              </span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem('sparky-chat-history');
                  toast({
                    title: "Chat cleared",
                    description: "Conversation history has been cleared",
                    duration: 2000,
                  });
                }}
                title="Clear chat history"
                data-testid="button-clear-chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {isSupported && isEligibleRole && (
              <MicrophoneStatus
                isListening={isListening}
                isActivated={isActivated}
                error={voiceError}
                permissionStatus={permissionStatus}
                onToggle={() => {
                  setVoiceEnabled(!voiceEnabled);
                  toggleListening();
                  if (!isListening) {
                    toast({
                      title: "Voice Listening Started",
                      description: "Say 'Sparky' to activate assistant",
                      duration: 3000,
                    });
                  }
                }}
                className="h-8 w-8"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(true)}
              data-testid="button-minimize-assistant"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-assistant-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
          {voiceError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {voiceError}
              </AlertDescription>
            </Alert>
          )}
          <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef} data-testid="scroll-messages">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4" data-testid="container-welcome">
                <Sparkles className="h-12 w-12 text-primary mb-3 animate-pulse" />
                <p className="text-sm font-medium mb-2">Hi! I'm Sparky!</p>
                <p className="text-xs text-muted-foreground">
                  Your friendly AI assistant for all things electrical.
                  <br />Ask me about invoices, compliance, clients, or anything else!
                </p>
                {isSupported && isEligibleRole && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                    <p className="text-xs font-medium text-primary flex items-center justify-center gap-1">
                      <Mic className="h-4 w-4 animate-pulse" />
                      Voice Control Available!
                    </p>
                    <p className="text-xs text-center">
                      1. Click the <strong>pulsing microphone button</strong> above
                      <br />
                      2. Say <strong>"Sparky"</strong> to activate
                      <br />
                      3. Ask me anything!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && message.status && (
                      <div className="mb-1" title={message.status === "sending" ? "Sending..." : message.status === "error" ? "Failed to send" : "Delivered"}>
                        {message.status === "sending" && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {message.status === "sent" && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        {message.status === "error" && (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start" data-testid="container-typing-indicator">
                    <div className="bg-muted rounded-lg overflow-hidden">
                      <AIThinkingLoader message="Sparky is thinking..." />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything or hold mic to speak..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
              data-testid="input-ai-message"
            />
            <div className="flex flex-col gap-2">
              {isSupported && isEligibleRole && (
                <Button
                  onMouseDown={startPushToTalk}
                  onMouseUp={stopPushToTalk}
                  onMouseLeave={stopPushToTalk}
                  onTouchStart={startPushToTalk}
                  onTouchEnd={stopPushToTalk}
                  variant={isPushToTalkActive ? "default" : "outline"}
                  size="icon"
                  className={`h-[60px] w-[60px] ${isPushToTalkActive ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
                  disabled={isLoading}
                  title="Hold to speak"
                  data-testid="button-push-to-talk"
                >
                  {isPushToTalkActive ? (
                    <Mic className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              )}
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px]"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
