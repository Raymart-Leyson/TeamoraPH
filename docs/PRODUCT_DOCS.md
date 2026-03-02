# TeamoraPH — Product Documentation

> The Philippines' remote job board connecting Filipino talent with global employers.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles](#2-user-roles)
3. [Public Features](#3-public-features)
4. [Candidate Features](#4-candidate-features)
5. [Employer Features](#5-employer-features)
6. [Admin & Moderation](#6-admin--moderation)
7. [Payments & Credits](#7-payments--credits)
8. [Identity Verification](#8-identity-verification)
9. [Messaging System](#9-messaging-system)
10. [Notifications](#10-notifications)
11. [Legal & Compliance](#11-legal--compliance)
12. [Tech Stack](#12-tech-stack)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Platform Overview

TeamoraPH is a Philippine-based remote job board built for Filipino professionals and global employers. The platform enables candidates to build rich profiles, apply to remote jobs with a credit-based system, and get identity-verified — while employers can post jobs, manage applications via a Kanban pipeline, and message top candidates.

**Core Value Props:**
- Verified Filipino talent pool with skills, experience, and documents
- Credit-based application system (quality over quantity)
- End-to-end application pipeline from job post → hire
- Subscription-gated employer tools (messaging, unlimited posting)
- Admin moderation layer for trust and safety

---

## 2. User Roles

| Role | Access Level | Description |
|---|---|---|
| `candidate` | App (candidate routes) | Job seekers with profiles and applications |
| `employer` | App (employer routes) | Companies posting jobs and managing applicants |
| `staff` | Admin (limited) | Moderators for jobs and reports |
| `admin` | Admin (full moderation) | Jobs, reports, verifications |
| `owner` | Admin (platform owner) | Full control including user management and settings |

Role assignment happens at signup (candidate/employer). Admin, staff, and owner roles are assigned by the owner via the user management panel.

---

## 3. Public Features

Accessible without authentication.

### Job Listings (`/jobs`)
- Browse all published jobs with search and filters
- **Search**: keyword matching on job title and description
- **Filters**: location, job type, required skills
- Pagination (12 jobs per page)
- "Already Applied" badge shown to logged-in candidates

### Job Detail (`/jobs/[id]`)
- Full job description, salary range, hours/week, location, job type
- Company information and logo
- Apply button with credit cost display
- Save job (bookmark) for later
- Report job (flag for moderation)

### Company Directory (`/companies`)
- Browse all companies with active job listings
- Search by company name
- Shows open role count per company
- Company website link

### Company Profile (`/companies/[id]`)
- Company description, industry, size, location, website
- All active job listings from that company

### Public Candidate Profile (`/candidates/[id]`)
- Publicly viewable profile for each candidate
- Shows headline, bio, skills with ratings, work experience, education, certifications, projects
- Resume download link (if uploaded)
- Social links (LinkedIn, GitHub, Portfolio)
- Verification badge if identity verified

---

## 4. Candidate Features

### Dashboard (`/candidate/dashboard`)

**Profile Completion Tracker** — 7-step progress widget:
1. Account created
2. Profile picture added
3. Headline written
4. Resume uploaded
5. Skills added
6. Work experience added
7. Identity verified

Each incomplete step is a direct clickable link to fix it.

**Stats cards:**
- Total applications (lifetime)
- Free credits (daily, refreshes to 50 cap)
- Premium credits (purchased, never expire)
- Profile view count

**Recent Applications** — last 5 with status badges and job links.

---

### Profile Management (`/candidate/profile`)

Edit/Preview toggle — switch between editing and seeing your public profile view.

**Basic Info:**
- First name, last name
- Avatar photo (uploaded to storage)
- Headline (e.g., "Senior Full-Stack Developer")
- Bio / short summary
- Location (country + city)
- Timezone
- Primary role
- Availability status

**Links:**
- Portfolio URL
- LinkedIn URL
- GitHub URL
- Resume (PDF upload)

**Experience Sections (add/edit/delete):**
- Work Experience — job title, company, employment type, start/end dates, responsibilities
- Education — school, degree level, field of study, years
- Certifications — name, issuing org, date, credential URL
- Projects — title, description, your role, project URL
- Skills — name + self-assessed rating (1–5 stars)

---

### Job Applications (`/candidate/applications`)
- View all submitted applications
- Filter by status: All / Pending / Reviewed / Accepted / Rejected
- Pagination (10 per page)
- Shows job title, company, location, applied date, current status badge
- Direct link to the job posting

---

### Saved Jobs (`/candidate/saved-jobs`)
- Bookmarked jobs for later review
- Remove bookmark or apply directly from the list
- Shows job details, salary, type, location

---

### Billing & Credits (`/candidate/billing`)

**Three credit packages (one-time purchase):**
| Package | Credits | PHP | USD |
|---|---|---|---|
| Basic | 10 credits | ₱49 | $5 |
| Standard | 50 credits | ₱199 | $15 |
| Premium | 100 credits | ₱349 | $25 |

- Currency auto-detected by IP (PHP for PH, USD for international)
- Powered by Stripe Checkout
- Purchased credits never expire
- Free credits: 10/day added automatically, capped at 50

---

### Applying to Jobs

When applying to a job:
1. Fill in: email, subject, cover letter
2. Choose how many credits to allocate (minimum 1)
3. System deducts free credits first, then purchased credits
4. One application per candidate per job (duplicates blocked)
5. Higher credit allocation can signal stronger interest to employers

---

### Identity Verification (`/verification`)

Four verification steps with a visual trust score (0–100%):

| Step | Weight | What to submit |
|---|---|---|
| Email | 15% | Auto-verified on signup |
| Government ID | 35% | Passport, UMID, or Driver's License |
| Identity Selfie | 30% | Photo of you holding your ID |
| Social Presence | 20% | LinkedIn or GitHub profile URL |

Documents are stored in a private, encrypted bucket and never shared with employers. Manual review by TeamoraPH staff.

---

### Messaging (`/candidate/messages`)
- Inbox listing all conversations with employers
- Unread message count per conversation
- Send and receive messages (up to 4,000 characters)
- Real-time message delivery via Supabase Realtime

---

## 5. Employer Features

### Dashboard (`/employer/dashboard`)
- Published jobs count
- Total applicants across all jobs
- Subscription status with renewal date
- Profile impressions (company views + job views combined)
- Recent job posts with view counts and management links

---

### Company Profile (`/employer/profile`)

Edit/Preview toggle — see how your company profile appears to candidates.

**Company Info:**
- Company name, website, industry, size, location
- Company logo (uploaded to storage)
- About / description

**Personal Info:**
- First name, last name, position title

---

### Job Management (`/employer/jobs`)
- List all jobs: drafts, pending review, published, closed
- Filter by status
- Per-job: publish, unpublish, close actions

**Job Post Limits by Tier:**

| Tier | Monthly Job Posts | Publish Speed |
|---|---|---|
| Free | 3 per month | Pending review → 3-day delay after approval |
| Subscribed | Unlimited | Instant publish |

---

### Post a Job (`/employer/post-job`)

**Job form fields:**
- Title (required)
- Description (required, rich text)
- Location
- Job type (full-time, part-time, contract, etc.)
- Salary range
- Hours per week
- Skills required (multi-value)
- Remote region preference

---

### Application Pipeline (`/employer/jobs/[id]`)

**Kanban Board — 4 columns:**
1. Pending
2. Shortlisted
3. Interviewing
4. Hired / Rejected

Per-application card shows candidate avatar, name, headline, and credits allocated. Click to open the full application.

---

### Full Application View (`/employer/jobs/[id]/applications/[applicationId]`)
- Candidate's cover letter, email, subject
- Credits allocated (signal of candidate seriousness)
- Link to full candidate profile
- Resume download
- Add employer note with 1–5 star rating
- Change application status
- Start conversation (requires active subscription)

---

### Billing & Subscription (`/employer/billing`)

**Pro Talent** — ₱69/month (or USD equivalent)
- Unlimited job postings
- Unlimited candidate messaging
- Instant job publish (no moderation delay)
- Verified employer badge

**Premium Search** — ₱99/month
- Everything in Pro
- Priority job placement in search results
- Dedicated account manager
- Early access to top talent

Powered by Stripe subscriptions. Tracked in `subscriptions` table with status and renewal date.

---

### Messaging (`/employer/messages`)
- Inbox with all candidate conversations
- Send messages only with an active subscription
- Real-time delivery

---

## 6. Admin & Moderation

### Staff (`/staff/*`)
- Review and approve/reject pending job posts
- View and handle user reports
- Limited to moderation actions only

### Admin (`/admin/*`)
- Full job moderation (approve/reject with notes)
- Reports management (dismiss / action taken / force remove)
- Verification review

### Owner (`/owner/*`)

**Dashboard** — Pending jobs count, pending verifications count, recent activity.

**Job Review (`/owner/jobs`):**
- See all pending submissions
- Approve → auto-publish (subscribed) or publish with 3-day delay (free)
- Reject with feedback note sent to employer

**Verification Review (`/owner/verifications`):**
- See all pending verification requests
- View uploaded documents
- Approve or reject with notes
- Individual flags set per verification type

**Reports (`/owner/reports`):**
- View all user/job reports with reasons
- Actions: Dismiss / Mark Action Taken / Force Remove (flags the job)

**User Management (`/owner/users`):**
- View all users across all roles
- Change any user's role (candidate → employer → staff → admin)

**Moderation Logs (`/owner/logs`):**
- Audit trail of every moderation action
- Who did what, on what, and when

---

## 7. Payments & Credits

### Credit System (Candidates)

Credits are consumed when applying to jobs and signal candidate seriousness to employers.

**Free Credits:**
- 10 credits added every UTC day automatically
- Capped at 50 total free credits
- Called on dashboard load and job application

**Purchased Credits:**
- One-time Stripe purchase, never expire
- Deducted only after free credits are exhausted

**Credit Deduction Logic:**
```
credits_to_deduct = requested_credits
if free_credits >= credits_to_deduct:
    deduct all from free_credits
else:
    deduct remaining free_credits, rest from bought_credits
```

### Stripe Integration

- Stripe Checkout for one-time credit purchases (candidates)
- Stripe Subscriptions for employer plans
- Webhook at `/api/stripe/webhook` handles subscription lifecycle events
- Currency auto-detected (PHP / USD)
- Stripe customer ID stored per user

---

## 8. Identity Verification

### Purpose
Build trust between candidates and employers. Verified profiles receive a visible shield badge and higher placement in searches (planned).

### Verification Flow

```
Candidate submits documents
        ↓
Upload to private Supabase Storage bucket
        ↓
Verification request created (status: pending)
        ↓
Admin/Staff reviews in /verifications panel
        ↓
Approve → sets individual flags + verification_status: 'verified'
Reject  → sends notes back to candidate
```

### Document Storage Security
- Private bucket with access-controlled policies
- Documents not accessible via public URL
- Deleted within 14 days after decision (per Privacy Policy)

### Database Flags (on `profiles`)
| Column | Set When |
|---|---|
| `id_verified` | Government ID approved |
| `selfie_verified` | Identity selfie approved |
| `social_verified` | Social profile link approved |
| `verification_status` | Overall: unverified / pending / verified |

---

## 9. Messaging System

- One conversation per application (linked via `application_id`)
- Real-time delivery via Supabase Realtime
- Message limit: 4,000 characters per message
- Unread tracking via `last_read_at` timestamp per participant
- Employer messaging gated behind active subscription
- Candidates can always read and reply

---

## 10. Notifications

**Notification Types:**
- `message` — new chat message received
- `application_update` — application status changed
- `job_alert` — new matching job posted
- `system` — platform announcements

**Features:**
- Realtime badge count in navbar
- Dropdown showing 20 most recent
- Mark individual as read
- Mark all as read
- Clear all

---

## 11. Legal & Compliance

### Terms of Service (`/terms`)
- Eligibility (18+)
- Candidate and Employer responsibilities
- Prohibited conduct
- Credits and payments policy
- Identity verification policy
- Intellectual property
- Limitation of liability
- Termination policy
- Governing law: Republic of the Philippines, Cebu City courts

### Privacy Policy (`/privacy`)
- Compliant with the **Philippine Data Privacy Act of 2012 (R.A. 10173)**
- Data collected: account, professional, verification documents, usage/technical
- Legal basis for processing
- Data sharing (with employers, service providers only)
- Retention periods (30 days for deleted accounts, 14 days for verification docs)
- Security: TLS in transit, AES-256 at rest, RLS per user
- User rights: access, correction, erasure, portability, objection
- Data Protection Officer contact
- National Privacy Commission (NPC) referral

### Signup Acceptance
- Users must check a Terms + Privacy acceptance checkbox to create an account
- Validated both client-side (`required`) and server-side

---

## 12. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Payments | Stripe |
| UI Library | ShadCN/UI + Tailwind CSS |
| Deployment | Vercel (planned) |

**Key Database Tables:**
`profiles`, `candidate_profiles`, `employer_profiles`, `companies`, `job_posts`, `applications`, `saved_jobs`, `subscriptions`, `conversations`, `messages`, `notifications`, `reports`, `verification_requests`, `candidate_experience`, `candidate_education`, `candidate_certifications`, `candidate_projects`, `candidate_skills`, `application_notes`, `moderation_logs`

---

## 13. Future Roadmap

Ideas and features planned or worth building. Ordered roughly by priority.

---

### AI-Powered Resume Tools

#### AI Resume Builder
Allow candidates to build a professional resume directly from their TeamoraPH profile data (experience, education, skills, projects, certifications).

- Generate a polished, ATS-friendly PDF resume from existing profile data
- Multiple template styles (modern, minimal, classic)
- One-click export to PDF
- Auto-fill from profile — no re-entry needed
- Could be gated behind premium credits or subscription

#### ATS Resume Optimization
Score a candidate's resume against a specific job description and suggest improvements.

- Upload or use existing resume
- Paste job description or select from TeamoraPH job listing
- Score: keyword match %, format compliance, section completeness
- Suggestions: missing keywords, weak phrasing, formatting issues
- Re-score after edits

#### Tailored Resume Generator
Generate a job-specific version of the resume for each application.

- Select a job posting
- AI rewrites the candidate's experience bullets and summary to align with that job's requirements
- Highlights matching skills
- Download as PDF per application
- Replaces generic resume with targeted one

#### Cover Letter Generator
AI drafts a cover letter based on candidate profile + job description.

- Uses candidate's experience, skills, headline
- Tailored to the specific job and company tone
- Editable before submitting
- Optional: auto-attach to application

---

### Smart Matching & Search

#### Candidate–Job Matching Score
Show candidates how well they match a job before applying.

- Compute a match score (0–100%) based on:
  - Skill overlap with `skills_required`
  - Experience level vs. job seniority
  - Location/timezone compatibility
  - Availability vs. job type
- Display on job cards and job detail pages
- Sort jobs by match score in candidate view

#### Employer Candidate Search
Allow employers to proactively search the candidate pool (currently passive — employers only see applicants).

- Filter by skills, experience level, location, availability, verification status
- Sort by profile completion, verification score, last active
- Favorite/shortlist candidates without a job posting
- Gated behind Pro+ subscription

#### Smart Application Ranking
Rank incoming applications for employers using a computed score.

- Factor in: credits allocated, profile completeness, verification status, skill match, cover letter quality (AI)
- Show ranked list alongside Kanban board
- "Best Match" badge on top applications

---

### Employer Tools

#### Interview Scheduling
Integrate calendar booking within the platform.

- Employer sends interview invite via messages
- Candidate sees available time slots and confirms
- Calendar integration (Google Calendar / Outlook)
- Automated reminders (email/notification)

#### Offer Letter Generator
Issue a digital offer letter from within the platform.

- Template-based offer letter (salary, role, start date, terms)
- Candidate accepts/declines in-platform
- Creates a milestone record on the application

#### Analytics Dashboard (Employer)
Deeper hiring analytics beyond current view counts.

- Time-to-hire per job
- Application funnel (applied → shortlisted → interviewed → hired)
- Drop-off rates per stage
- Top skills in your applicant pool
- Benchmark vs. platform averages

#### Job Boost / Sponsored Listings
Employers pay to promote a job post to the top of search results.

- Sponsored badge on job card
- Higher ranking in job listing sort
- Credit-based or flat-fee per duration (7/14/30 days)

---

### Candidate Growth Tools

#### Skills Assessment / Testing
Let candidates demonstrate skills beyond self-ratings.

- Short timed assessments per skill category (e.g., JavaScript, Excel, English)
- Pass = verified skill badge on profile
- Built-in or third-party integration (HackerRank, TestGorilla)

#### Portfolio Showcase
Rich media portfolio on the candidate profile.

- Upload images, embed video links, link live demos
- Per-project showcase panel
- Visible on public profile and to employers

#### Learning Recommendations
Suggest courses/resources based on skill gaps for target roles.

- Compare candidate skills to the most common job requirements
- Surface free/paid courses (Coursera, YouTube, freeCodeCamp)
- Track completion and add certifications

#### Application Insights
Give candidates feedback on their application performance.

- Response rate %
- Average credits competitors allocate (anonymized aggregate)
- Profile strength vs. accepted applicants (anonymized)
- Suggestions: "Employers who shortlisted you also looked for..."

---

### Trust & Safety

#### AI Job Fraud Detection
Auto-flag suspicious job posts before moderation review.

- Detect: unrealistic pay, common scam phrases, suspicious links
- Assign a fraud risk score to every new post
- Flag high-risk posts for priority human review

#### Background Check Integration
Optional third-party background check for verified candidates.

- Integration with a Philippine BGC provider (e.g., Verifact, Checkr)
- Opt-in for candidates, visible badge on profile
- Employer requests BGC with candidate consent
- Results stored encrypted, shared only with requesting employer

#### Two-Factor Authentication (2FA)
Add 2FA for enhanced account security.

- TOTP (authenticator app) or SMS OTP
- Required for admin/owner roles
- Optional for candidates and employers

---

### Platform Expansion

#### Employer Reviews
Allow candidates to rate their experience with employers after a hiring outcome.

- 1–5 star rating with optional written review
- Response rate, communication quality, professionalism scores
- Aggregate rating on company profile (public)
- Moderated before publishing

#### Referral Program
Candidates and employers earn credits for successful referrals.

- Unique referral link per user
- Candidate referral → referred candidate gets bonus free credits on signup
- Employer referral → discount on first subscription month

#### Email Job Alerts
Candidates subscribe to alerts for new matching jobs.

- Filter by: skills, location, job type
- Digest frequency: daily or weekly
- Opt-in/opt-out in profile settings
- Deep link back to job in platform

#### Mobile App
Native iOS/Android app for candidates.

- Browse and apply to jobs
- Manage profile
- Real-time chat notifications (push)
- Job match alerts

#### API / Integrations
Allow external ATS or HRIS systems to integrate with TeamoraPH.

- REST API for job post syndication
- Webhook events for application status changes
- LinkedIn profile import for candidate onboarding

---

*Last Updated: February 2026*
*Version: 1.4 (MVP)*
