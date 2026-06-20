# CareBridge Navigator — Design Documentation

## 1. Design Goal

CareBridge Navigator should immediately communicate:

> This is an AI benefits and support navigator for caregivers after stroke discharge.

The UI must not look like a generic chatbot, a rehab-only app, or a simple resource directory.

The design should help a caregiver understand:

- What support may fit my situation?
- Why does CareBridge recommend it?
- What information is still missing?
- What documents should I prepare?
- What should I do next?
- Which source supports this recommendation?

---

## 2. Product Narrative

The design narrative is:

```text
Guided Intake
    ↓
Potential Support Matches
    ↓
Why This May Fit
    ↓
Source Evidence
    ↓
Action Plan
```

Rehab Snapshot is a supporting feature:

```text
Optional Rehab Snapshot
    ↓
Adds functional context
    ↓
Updates support priorities
```

It should not dominate the UI.

---

## 3. Visual Style

CareBridge should feel:

- calm
- trustworthy
- supportive
- healthcare-adjacent
- practical
- modern
- easy to understand

Avoid:

- overly clinical hospital UI
- dark fintech dashboard style
- cluttered admin panels
- full-screen chatbot interface
- excessive animations
- decorative complexity

Recommended visual language:

- light background
- white or soft cards
- rounded corners
- subtle borders
- restrained shadows
- purple/blue primary accent
- green for positive/completed
- amber/orange for attention
- red only for serious warnings
- simple icons
- large readable text

---

## 4. Main Navigation

Recommended bottom or side navigation:

```text
Home
Intake
Benefits
Action Plan
Profile
```

Alternative:

```text
Home
Assessment
Benefits
Plan
Profile
```

For hackathon clarity, prefer:

```text
Home
Intake
Benefits
Plan
Profile
```

Reason:

- “Benefits” makes Direction A obvious.
- “Plan” highlights actionability.
- Rehab should be inside the flow, not the main identity of the app.

---

## 5. Screen 1 — Home / Landing Page

### Purpose

Judge should understand the product in 3 seconds.

### Header

```text
CareBridge
Helping families navigate post-stroke recovery support
```

### Hero Card

This should occupy the largest visual area.

```text
Your Support Navigation Plan

Based on your situation, you may benefit from:

1. Rehabilitation Services
2. Transportation Assistance
3. Caregiver Support Programs

Button:
View Support Plan
```

### Current Situation

Show a concise situation summary:

```text
Your mother was discharged:
5 days ago

Current situation:
✓ Lives at home
⚠ Mobility challenges
⚠ No transportation
✓ Family caregiver available
```

### Care Signals

Smaller cards:

```text
Mobility
Moderate Concern

Transportation
Needs Support

Caregiver Burden
Elevated
```

### Design Rules

- Benefits/support plan must be visually dominant.
- Rehab signal should be secondary.
- Avoid showing too many metrics.
- Focus on next action.

---

## 6. Screen 2 — Guided Intake

### Purpose

This is one of the most important screens because the brief asks the AI to ask relevant questions.

### Layout

Recommended layout:

```text
Left:
Question card

Right:
CareBridge is considering panel
```

On mobile, stack vertically.

### Question Card

Example:

```text
Step 3 of 6 — Transportation

Can your loved one attend appointments easily?

[Yes]
[No vehicle]
[Cannot drive]
[Need transportation support]
[Not sure]
```

### Intake Steps

1. Discharge context
2. Mobility
3. Transportation
4. Insurance
5. Caregiver situation
6. Support pressure / biggest challenge

### AI Consideration Panel

Show visible factors, not chain-of-thought:

```text
CareBridge is considering:

✓ Mobility needs
✓ Transportation barriers
✓ Insurance pathway
✓ Caregiver burden
✓ Possible support programs
```

### Important UX Rules

- One main question at a time.
- Always allow “Not sure”.
- Use plain language.
- Show progress.
- Use large buttons.
- Avoid long forms.
- Explain why sensitive questions matter.

Example:

```text
Why we ask:
Some support programs depend on location, insurance, or household situation.
```

---

## 7. Screen 3 — Potential Support Matches

### Purpose

Show that CareBridge is not just listing resources. It is interpreting the situation.

### Page Title

```text
Support You May Explore
```

or

```text
Potential Support Matches
```

Avoid:

```text
Resource Directory
```

### Recommendation Card Format

Each card should include:

```text
Transportation Assistance

Status:
Possible Match

Why CareBridge recommends this:
✓ You reported difficulty attending appointments
✓ Transportation is a barrier
✓ Follow-up visits may be needed after discharge

Still missing:
? Confirm insurance transportation coverage

Button:
View Details
```

### Match Status Badge

Use:

- Likely Match
- Possible Match
- More Info Needed

Do not use:

- Eligible
- Approved
- Guaranteed

### Visual Rules

- Use checkmarks for matched factors.
- Use question marks for missing information.
- Use source icon for citations.
- Keep text short on cards.
- Show detailed evidence only after clicking.

---

## 8. Screen 4 — Explainability / Why Recommended

### Purpose

Help users and judges understand the reasoning.

### Page Title

```text
Why did CareBridge recommend this?
```

### Layout

```text
Your situation
    ↓
Matched support factors
    ↓
Relevant source evidence
    ↓
Recommended next step
```

Example:

```text
Your situation:
- Recent discharge
- Mobility difficulty
- No reliable transportation

Matched support factors:
- Transportation barrier
- Rehab follow-up need

Still missing:
- Insurance transportation coverage
- Appointment location

Recommended next step:
Ask the social worker or insurance provider about transportation support.
```

### Source Evidence Section

```text
Sources used:
- Transportation Assistance Guide, page 4
- Stroke Discharge Resource Guide, page 7
```

### Design Rules

- Do not expose raw chain-of-thought.
- Show input factors and matched criteria.
- Show missing information.
- Show citations.

---

## 9. Screen 5 — Resource / Benefit Detail

### Purpose

Convert a recommendation into a clear, actionable support pathway.

### Required Sections

```text
Resource name
Match status
Why this may fit
Eligibility factors considered
Missing information
Documents to prepare
Next steps
Questions to ask
Sources
Disclaimer
```

### Example

```text
Transportation Assistance

Match Status:
Possible Match

Why this may fit:
You reported that transportation is a barrier and follow-up rehab appointments may be needed.

Eligibility factors considered:
✓ Transportation difficulty
✓ Recent discharge
? Insurance coverage still needs confirmation

Documents to prepare:
- Insurance card
- Appointment date
- Clinic address
- Discharge summary

Next step:
Ask your insurance provider or social worker whether transportation support is available.
```

### Source Card

```text
Source:
Transportation Assistance Guide

Type:
Official PDF

Page:
4

Excerpt:
"Transportation support may be available for covered medical appointments."

Button:
View Source
```

---

## 10. Screen 6 — Action Plan

### Purpose

This is the screen judges should remember.

### Page Title

```text
Your Next Steps This Week
```

### Priority Card Format

```text
Priority 1
Confirm rehabilitation follow-up

Why:
No rehab appointment has been confirmed after recent discharge.

Checklist:
□ Call the clinic
□ Confirm whether referral was received
□ Prepare insurance information
□ Ask whether home-based therapy is available
```

### Recommended Priority Sections

```text
Today
This Week
At Next Appointment
```

### Design Rules

- Make the output actionable.
- Use checkboxes.
- Avoid abstract advice.
- Show who to contact.
- Show documents to prepare.
- Make it easy to copy or present to a provider.

---

## 11. Screen 7 — Questions to Ask

### Purpose

Help caregivers communicate with professionals.

### Group questions by stakeholder:

```text
Ask the doctor
Ask the therapist
Ask the social worker
Ask the insurance provider
```

### Example

Ask the therapist:

```text
- Is home-based therapy appropriate?
- What movements are safe to practice at home?
- Does the patient need mobility equipment?
```

Ask the social worker:

```text
- Are transportation services available?
- Are there caregiver support programs?
- What documents should we prepare?
```

Ask the insurance provider:

```text
- Is transportation to rehab covered?
- Does home health require prior authorization?
```

---

## 12. Screen 8 — Source Viewer

### Purpose

Make RAG evidence visible.

### Modal or page content:

```text
Source title
Publisher
Source type
Authority level
URL
Page number
Relevant excerpt
Why this source was used
```

### Example

```text
Transportation Assistance Guide

Publisher:
Example County Agency

Authority:
Official government source

Relevant excerpt:
"Transportation support may be available for covered medical appointments."

Why CareBridge used this:
This source describes transportation support and application steps.
```

### Design Rules

- Do not overwhelm the user with long chunks.
- Show the excerpt that supports the recommendation.
- Let users open the original source if URL exists.
- Clearly label source authority.

---

## 13. Screen 9 — Rehab Snapshot Integration

### Purpose

Show how Module 2 improves navigation without becoming the main product.

### Header

```text
Optional Mobility Snapshot
```

### Subtext

```text
This snapshot helps CareBridge better understand mobility challenges.
It does not provide a medical diagnosis.
```

### Result Card

```text
Mobility Concern:
Moderate

Observed:
- Difficulty standing
- Reduced arm movement

Button:
Update Support Plan
```

### Updated Plan Screen

Show:

```text
What changed:
Rehab follow-up moved from Priority 2 to Priority 1.

Why:
The mobility snapshot suggested standing may be difficult.

Recommended next step:
Ask the therapist whether home-based rehab or mobility support should be considered.
```

### Design Rules

- Never call this a diagnosis.
- Never claim clinical severity.
- Use “observed” language.
- Ask user to confirm before updating plan if possible.

---

## 14. Responsible AI Banner

Place a small banner or footer across important screens:

```text
CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals.
```

On recommendation cards:

Use:

```text
You may qualify
This may fit
Worth discussing
More information needed
```

Never use:

```text
You qualify
You are approved
You need this treatment
AI diagnosed
```

---

## 15. UI Copy Rules

### Preferred Language

- “may qualify”
- “may benefit”
- “possible match”
- “worth discussing”
- “more information needed”
- “based on the information provided”
- “ask your provider”
- “confirm with the program administrator”
- “source evidence”

### Avoid

- “you qualify”
- “guaranteed”
- “diagnosed”
- “severe impairment”
- “AI decided”
- “medical advice”
- “treatment required”

---

## 16. Component Suggestions

### Core Components

```text
AppShell
PageHeader
SupportPlanHero
IntakeQuestionCard
AIConsideringPanel
RecommendationCard
MatchStatusBadge
MissingInfoList
SourceEvidenceCard
SourceViewerModal
ActionChecklist
QuestionGroup
ResponsibleAIBanner
RehabSnapshotSummary
```

### shadcn/ui Components

Use:

- Button
- Card
- Badge
- Progress
- Tabs
- Accordion
- Dialog
- Alert
- Separator
- Checkbox
- Input
- Select
- Textarea optional

---

## 17. Color Guidance

Suggested semantic usage:

- Primary purple/blue: main action buttons and active navigation.
- Green: completed or matched factor.
- Amber/orange: attention, missing info, possible match.
- Red: serious safety warnings only.
- Neutral gray: secondary information.
- White cards on light background.

Do not overuse red or alarming colors.

---

## 18. Accessibility Guidance

Caregiver may be stressed and tired. UI should be easy to scan.

Rules:

- Use large enough text.
- Use clear button labels.
- Avoid dense paragraphs.
- Prefer bullet points.
- Provide “Not sure” option.
- Do not rely only on color.
- Use icons plus text.
- Keep tap targets large.
- Show progress.
- Make errors clear and calm.

---

## 19. Hackathon UI Priorities

Must-have:

- Home/Landing
- Guided Intake
- Potential Support Matches
- Resource Detail
- Action Plan
- Source Viewer
- Responsible AI banner

Should-have:

- Explainability page
- Questions to Ask
- Rehab Snapshot update screen

Nice-to-have:

- Profile page
- Saved resources
- Print/export summary
- RAG playground
- Full document manager

---

## 20. Final Design Principle

Every screen should reinforce this message:

> CareBridge asks the right questions, interprets possible support options, grounds recommendations in trusted sources, and gives caregivers a clear next step.

If a screen makes CareBridge feel like only a rehab tracker, chatbot, or directory, redesign it around benefit navigation.
