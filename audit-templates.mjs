/**
 * Template Journey Coherence Audit
 * Analyzes all 105 template prompts for potential broken journey patterns.
 * 
 * Checks:
 * 1. Flow steps that imply "view details" → must have a details step before action
 * 2. Carousel → customer selection → must acknowledge selection before next action
 * 3. Booking flows → must have date/time selection before confirmation
 * 4. Product selection → must show product info before purchase/booking
 */

import { readFileSync } from 'fs';

// Read the template catalog source
const src = readFileSync('./shared/templateCatalog.ts', 'utf8');

// Extract all templates
const templateRegex = /\{\s*id:\s*"([^"]+)"[\s\S]*?prompt:\s*"([\s\S]*?)"\s*,?\s*\}/g;
let match;
const templates = [];
while ((match = templateRegex.exec(src)) !== null) {
  const id = match[1];
  const prompt = match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  
  // Also extract flowSteps
  const fullBlock = match[0];
  const stepsMatch = fullBlock.match(/flowSteps:\s*\[([\s\S]*?)\]/);
  const steps = stepsMatch 
    ? stepsMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []
    : [];
  
  const titleMatch = fullBlock.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : id;
  
  const industryMatch = fullBlock.match(/industry:\s*"([^"]+)"/);
  const industry = industryMatch ? industryMatch[1] : 'Unknown';
  
  const typeMatch = fullBlock.match(/messageType:\s*"([^"]+)"/);
  const messageType = typeMatch ? typeMatch[1] : 'unknown';
  
  templates.push({ id, title, industry, messageType, steps, prompt });
}

console.log(`\n=== TEMPLATE JOURNEY COHERENCE AUDIT ===`);
console.log(`Total templates found: ${templates.length}\n`);

const issues = [];

for (const t of templates) {
  const templateIssues = [];
  const promptLower = t.prompt.toLowerCase();
  const stepsLower = t.steps.map(s => s.toLowerCase());
  
  // RULE 1: If flow has "carousel" → must have a step where customer selects → must acknowledge selection
  const hasCarousel = promptLower.includes('carousel');
  const hasSelection = promptLower.includes('select') || promptLower.includes('choose') || promptLower.includes('pick');
  
  if (hasCarousel && !hasSelection && t.messageType !== 'authentication') {
    templateIssues.push({
      severity: 'HIGH',
      rule: 'CAROUSEL_NO_SELECTION',
      detail: 'Has carousel but no explicit customer selection step — AI may skip product details after "View Details" click'
    });
  }
  
  // RULE 2: If flow mentions "View Details" or similar in buttons → must have a details display step
  const hasViewDetails = promptLower.includes('view details') || promptLower.includes('learn more') || promptLower.includes('more info');
  const hasDetailsStep = promptLower.includes('show details') || promptLower.includes('product details') || 
    promptLower.includes('feature') || promptLower.includes('specification') || promptLower.includes('highlight');
  
  // RULE 3: Booking flows must have date/time selection
  const isBookingFlow = /\b(book|booking|appointment|schedule|reservation|test drive|viewing|consultation|tour)\b/i.test(t.prompt);
  const hasDateTimeSelection = promptLower.includes('interactive_list') && (promptLower.includes('date') || promptLower.includes('time') || promptLower.includes('slot'));
  
  if (isBookingFlow && !hasDateTimeSelection && t.messageType !== 'authentication') {
    templateIssues.push({
      severity: 'MEDIUM',
      rule: 'BOOKING_NO_DATETIME',
      detail: 'Booking flow without explicit interactive_list for date/time selection — AI may skip slot picker'
    });
  }
  
  // RULE 4: Marketing flows with product carousel should explicitly instruct "after customer selects, show details"
  if (t.messageType === 'marketing' && hasCarousel) {
    const hasPostSelectionAck = promptLower.includes('after the customer select') || 
      promptLower.includes('after the customer pick') ||
      promptLower.includes('after the customer choose') ||
      promptLower.includes('let the customer select') ||
      promptLower.includes('let them select');
    
    if (!hasPostSelectionAck) {
      templateIssues.push({
        severity: 'HIGH',
        rule: 'CAROUSEL_NO_ACK',
        detail: 'Marketing carousel without explicit "after customer selects" instruction — AI may jump to next action without acknowledging selection'
      });
    }
  }
  
  // RULE 5: Check flowSteps for logical gaps
  // If steps go from "Carousel" directly to "Booking" without "Details" in between
  for (let i = 0; i < stepsLower.length - 1; i++) {
    const current = stepsLower[i];
    const next = stepsLower[i + 1];
    
    // Carousel/showcase → directly to booking/confirmation without details
    if ((current.includes('carousel') || current.includes('showcase') || current.includes('comparison')) &&
        (next.includes('book') || next.includes('confirm') || next.includes('order') || next.includes('date/time'))) {
      // Check if there's a details/selection step implied
      if (!current.includes('select') && !next.includes('select')) {
        // This is OK if the prompt explicitly handles it
        const promptHandlesIt = promptLower.includes('after the customer') || promptLower.includes('let the customer') || promptLower.includes('let them');
        if (!promptHandlesIt) {
          templateIssues.push({
            severity: 'MEDIUM',
            rule: 'FLOW_STEP_GAP',
            detail: `Flow steps jump from "${t.steps[i]}" → "${t.steps[i+1]}" without explicit selection/details step`
          });
        }
      }
    }
  }
  
  // RULE 6: Prompt should not have ambiguous "and include a [action] button" without preceding context
  // e.g., "show carousel... and include a book-now button" without "after customer selects from carousel"
  const quickActionPattern = /carousel[\s\S]{0,100}(include|and)\s+(a|an)\s+(book|order|buy|purchase|enroll|apply|sign.?up|register|upgrade)/i;
  if (quickActionPattern.test(t.prompt) && !t.prompt.toLowerCase().includes('after the customer')) {
    templateIssues.push({
      severity: 'HIGH',
      rule: 'CAROUSEL_PREMATURE_ACTION',
      detail: 'Carousel followed immediately by action button without customer selection step — will create broken journey'
    });
  }
  
  if (templateIssues.length > 0) {
    issues.push({ template: t, issues: templateIssues });
  }
}

// Report
console.log(`\n${'='.repeat(80)}`);
console.log(`ISSUES FOUND: ${issues.length} templates with potential journey problems`);
console.log(`${'='.repeat(80)}\n`);

let highCount = 0, medCount = 0;

for (const { template: t, issues: tIssues } of issues) {
  console.log(`\n--- ${t.id} (${t.industry} / ${t.messageType}) ---`);
  console.log(`  Title: ${t.title}`);
  console.log(`  Steps: ${t.steps.join(' → ')}`);
  for (const issue of tIssues) {
    const icon = issue.severity === 'HIGH' ? '🔴' : '🟡';
    console.log(`  ${icon} [${issue.severity}] ${issue.rule}: ${issue.detail}`);
    if (issue.severity === 'HIGH') highCount++;
    else medCount++;
  }
}

console.log(`\n${'='.repeat(80)}`);
console.log(`SUMMARY: ${highCount} HIGH severity, ${medCount} MEDIUM severity`);
console.log(`Templates OK: ${templates.length - issues.length}/${templates.length}`);
console.log(`${'='.repeat(80)}\n`);

// Also list templates that are GOOD examples of journey coherence
console.log(`\nGOOD EXAMPLES (templates with explicit post-selection acknowledgment):`);
for (const t of templates) {
  if (t.prompt.toLowerCase().includes('after the customer select') || 
      t.prompt.toLowerCase().includes('after the customer pick') ||
      t.prompt.toLowerCase().includes('let the customer select') ||
      t.prompt.toLowerCase().includes('let them select')) {
    console.log(`  ✅ ${t.id}: ${t.title}`);
  }
}
