import { db } from "../db";
import { ai_lead_scores, sales_leads, clients, ai_agents } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI();

interface LeadScoringFactors {
  budgetScore: number;
  urgencyScore: number;
  fitScore: number;
  engagementScore: number;
  completenessScore: number;
}

interface LeadAnalysis {
  overallScore: number;
  factors: LeadScoringFactors;
  qualificationStatus: "unqualified" | "mql" | "sql" | "opportunity";
  summary: string;
  recommendations: string[];
  riskFactors: string[];
}

export async function scoreNewLead(leadId: string): Promise<LeadAnalysis | null> {
  try {
    // Get lead data
    const leads = await db
      .select()
      .from(sales_leads)
      .where(eq(sales_leads.id, leadId))
      .limit(1);
    
    if (leads.length === 0) {
      console.log(`[Lead Scoring] Lead not found: ${leadId}`);
      return null;
    }
    
    const lead = leads[0];
    
    // Calculate scoring factors
    const factors = calculateScoringFactors(lead);
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      factors.budgetScore * 0.25 +
      factors.urgencyScore * 0.20 +
      factors.fitScore * 0.25 +
      factors.engagementScore * 0.15 +
      factors.completenessScore * 0.15
    );
    
    // Determine qualification status
    const qualificationStatus = determineQualificationStatus(overallScore, factors);
    
    // Get AI-powered analysis
    const aiAnalysis = await getAILeadAnalysis(lead, factors, overallScore);
    
    // Store the score
    await storeLeadScore(leadId, overallScore, factors, qualificationStatus, aiAnalysis);
    
    return {
      overallScore,
      factors,
      qualificationStatus,
      summary: aiAnalysis.summary,
      recommendations: aiAnalysis.recommendations,
      riskFactors: aiAnalysis.riskFactors
    };
  } catch (error) {
    console.error(`[Lead Scoring] Error scoring lead ${leadId}:`, error);
    return null;
  }
}

function calculateScoringFactors(lead: any): LeadScoringFactors {
  // Budget Score (0-100)
  let budgetScore = 50; // Default moderate
  if (lead.estimated_value) {
    const value = parseFloat(lead.estimated_value);
    if (value >= 10000) budgetScore = 100;
    else if (value >= 5000) budgetScore = 85;
    else if (value >= 2000) budgetScore = 70;
    else if (value >= 500) budgetScore = 50;
    else budgetScore = 30;
  }
  
  // Urgency Score (0-100)
  let urgencyScore = 50;
  const priority = lead.priority?.toLowerCase();
  if (priority === "urgent" || priority === "emergency") urgencyScore = 100;
  else if (priority === "high") urgencyScore = 80;
  else if (priority === "medium") urgencyScore = 50;
  else if (priority === "low") urgencyScore = 30;
  
  // Check for urgency keywords in description
  const description = (lead.notes || lead.description || "").toLowerCase();
  if (description.includes("emergency") || description.includes("urgent") || description.includes("asap")) {
    urgencyScore = Math.min(100, urgencyScore + 20);
  }
  
  // Fit Score (0-100) - Based on service type match
  let fitScore = 70; // Default good fit
  const serviceType = (lead.service_type || lead.source || "").toLowerCase();
  
  // High-value services for an electrical company
  const highValueServices = ["panel upgrade", "ev charger", "new construction", "commercial", "rewire"];
  const mediumValueServices = ["repair", "outlet", "switch", "lighting", "inspection"];
  const lowValueServices = ["estimate only", "information", "quote"];
  
  if (highValueServices.some(s => serviceType.includes(s))) {
    fitScore = 90;
  } else if (mediumValueServices.some(s => serviceType.includes(s))) {
    fitScore = 70;
  } else if (lowValueServices.some(s => serviceType.includes(s))) {
    fitScore = 40;
  }
  
  // Engagement Score (0-100) - Based on lead activity
  let engagementScore = 50;
  
  // Check if lead has been responsive
  if (lead.last_contact) {
    const daysSinceContact = (Date.now() - new Date(lead.last_contact).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceContact < 1) engagementScore = 100;
    else if (daysSinceContact < 3) engagementScore = 80;
    else if (daysSinceContact < 7) engagementScore = 60;
    else engagementScore = 30;
  }
  
  // Completeness Score (0-100) - Based on information provided
  let completenessScore = 0;
  const fields = ["name", "email", "phone", "address", "notes", "service_type"];
  for (const field of fields) {
    if (lead[field] && String(lead[field]).trim()) {
      completenessScore += 100 / fields.length;
    }
  }
  completenessScore = Math.round(completenessScore);
  
  return {
    budgetScore,
    urgencyScore,
    fitScore,
    engagementScore,
    completenessScore
  };
}

function determineQualificationStatus(
  overallScore: number,
  factors: LeadScoringFactors
): "unqualified" | "mql" | "sql" | "opportunity" {
  // Opportunity: High score with strong budget and fit
  if (overallScore >= 80 && factors.budgetScore >= 70 && factors.fitScore >= 70) {
    return "opportunity";
  }
  
  // SQL (Sales Qualified Lead): Good score with engagement
  if (overallScore >= 65 && factors.engagementScore >= 60) {
    return "sql";
  }
  
  // MQL (Marketing Qualified Lead): Moderate score with potential
  if (overallScore >= 45) {
    return "mql";
  }
  
  // Unqualified
  return "unqualified";
}

async function getAILeadAnalysis(
  lead: any,
  factors: LeadScoringFactors,
  overallScore: number
): Promise<{ summary: string; recommendations: string[]; riskFactors: string[] }> {
  try {
    const prompt = `Analyze this electrical services lead and provide insights:

Lead Information:
- Name: ${lead.name || "Not provided"}
- Email: ${lead.email || "Not provided"}
- Phone: ${lead.phone || "Not provided"}
- Service Type: ${lead.service_type || lead.source || "Not specified"}
- Estimated Value: ${lead.estimated_value ? `$${lead.estimated_value}` : "Not specified"}
- Priority: ${lead.priority || "Normal"}
- Notes: ${lead.notes || "None"}
- Status: ${lead.status}

Scoring Factors:
- Budget Score: ${factors.budgetScore}/100
- Urgency Score: ${factors.urgencyScore}/100
- Fit Score: ${factors.fitScore}/100
- Engagement Score: ${factors.engagementScore}/100
- Completeness Score: ${factors.completenessScore}/100
- Overall Score: ${overallScore}/100

Provide a JSON response with:
1. "summary": A 1-2 sentence summary of this lead's potential
2. "recommendations": Array of 2-3 specific next actions to take
3. "riskFactors": Array of 0-2 potential concerns or risks

Response format: {"summary": "...", "recommendations": ["...", "..."], "riskFactors": ["..."]}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a sales analyst for T.G.E. PROS electrical services company. Analyze leads and provide actionable insights. Respond only with valid JSON."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || "Lead analysis pending.",
        recommendations: parsed.recommendations || ["Follow up with client", "Confirm service requirements"],
        riskFactors: parsed.riskFactors || []
      };
    }
    
    return {
      summary: "Lead received and scored. Ready for follow-up.",
      recommendations: ["Contact lead within 24 hours", "Confirm service requirements"],
      riskFactors: []
    };
  } catch (error) {
    console.error("[Lead Scoring] AI analysis error:", error);
    return {
      summary: "Lead scored automatically. AI analysis unavailable.",
      recommendations: ["Review lead details", "Contact within 24 hours"],
      riskFactors: []
    };
  }
}

async function storeLeadScore(
  leadId: string,
  overallScore: number,
  factors: LeadScoringFactors,
  qualificationStatus: string,
  aiAnalysis: { summary: string; recommendations: string[]; riskFactors: string[] }
): Promise<void> {
  // Check if score already exists
  const existing = await db
    .select()
    .from(ai_lead_scores)
    .where(eq(ai_lead_scores.lead_id, leadId))
    .limit(1);
  
  const scoreData = {
    overall_score: overallScore,
    engagement_score: factors.engagementScore,
    fit_score: factors.fitScore,
    urgency_score: factors.urgencyScore,
    qualification_status: qualificationStatus,
    ai_summary: aiAnalysis.summary,
    ai_recommendations: aiAnalysis.recommendations,
    ai_risk_factors: aiAnalysis.riskFactors,
    scoring_factors: factors,
    last_scored_at: new Date(),
    updated_at: new Date()
  };
  
  if (existing.length > 0) {
    // Update existing score with history
    const currentScore = existing[0];
    const history = (currentScore.score_history as any[] || []).slice(-9); // Keep last 10
    history.push({
      date: new Date().toISOString(),
      score: overallScore,
      previousScore: currentScore.overall_score
    });
    
    await db
      .update(ai_lead_scores)
      .set({ ...scoreData, score_history: history })
      .where(eq(ai_lead_scores.id, currentScore.id));
  } else {
    // Create new score
    await db.insert(ai_lead_scores).values({
      lead_id: leadId,
      ...scoreData,
      score_history: [{
        date: new Date().toISOString(),
        score: overallScore,
        reason: "Initial scoring"
      }],
      created_at: new Date()
    });
  }
}

// Score all unscored leads
export async function scoreAllLeads(): Promise<{ scored: number; failed: number }> {
  const unscored = await db
    .select()
    .from(sales_leads)
    .where(sql`${sales_leads.id} NOT IN (SELECT lead_id FROM ai_lead_scores WHERE lead_id IS NOT NULL)`);
  
  let scored = 0;
  let failed = 0;
  
  for (const lead of unscored) {
    const result = await scoreNewLead(lead.id);
    if (result) {
      scored++;
    } else {
      failed++;
    }
  }
  
  return { scored, failed };
}

// Re-score a lead (for manual refresh)
export async function rescoreLead(leadId: string): Promise<LeadAnalysis | null> {
  return scoreNewLead(leadId);
}

// Get lead score
export async function getLeadScore(leadId: string): Promise<any | null> {
  const scores = await db
    .select()
    .from(ai_lead_scores)
    .where(eq(ai_lead_scores.lead_id, leadId))
    .limit(1);
  
  return scores[0] || null;
}

// Bulk score leads by status
export async function scoreLeadsByStatus(status: string): Promise<{ scored: number; failed: number }> {
  const leads = await db
    .select()
    .from(sales_leads)
    .where(eq(sales_leads.status, status));
  
  let scored = 0;
  let failed = 0;
  
  for (const lead of leads) {
    const result = await scoreNewLead(lead.id);
    if (result) {
      scored++;
    } else {
      failed++;
    }
  }
  
  return { scored, failed };
}
