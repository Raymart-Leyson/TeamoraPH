import Link from "next/link";

export const metadata = {
    title: "Privacy Policy — TeamoraPH",
    description: "Understand how TeamoraPH collects, uses, and protects your personal data.",
};

const EFFECTIVE_DATE = "February 28, 2026";
const CONTACT_EMAIL = "privacy@teamoraph.com";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#EEE2DC]">
            <div className="max-w-4xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-12">
                    <p className="text-sm font-bold text-[#AC3B61] uppercase tracking-widest mb-3">Legal</p>
                    <h1 className="text-5xl font-black text-[#123C69] tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-[#123C69]/60 font-medium">
                        Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last Updated: {EFFECTIVE_DATE}
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2rem] p-10 space-y-10 text-[#123C69]">

                    {/* Intro */}
                    <p className="text-base leading-relaxed font-medium text-[#123C69]/80">
                        At <strong>TeamoraPH</strong> ("we", "us", or "our"), your privacy is a core commitment — not an afterthought. This Privacy Policy explains what personal data we collect, how we use it, and your rights under the <strong>Philippine Data Privacy Act of 2012 (R.A. 10173)</strong> and applicable international standards. By using TeamoraPH, you consent to the practices described here.
                    </p>

                    <Section title="1. Data We Collect">
                        <p><strong>a. Account Data</strong></p>
                        <ul>
                            <li>Name, email address, password (hashed), and role (candidate or employer)</li>
                            <li>Profile photo, headline, bio, location, timezone, and availability</li>
                            <li>Links to LinkedIn, GitHub, and portfolio</li>
                        </ul>
                        <p className="mt-3"><strong>b. Professional Data (Candidates)</strong></p>
                        <ul>
                            <li>Work experience, education history, projects, and certifications</li>
                            <li>Skills and self-assessed ratings</li>
                            <li>Resume/CV files uploaded to the Platform</li>
                        </ul>
                        <p className="mt-3"><strong>c. Company Data (Employers)</strong></p>
                        <ul>
                            <li>Company name, description, logo, website, industry, and size</li>
                            <li>Contact person's name, position, and email</li>
                            <li>Job postings and associated content</li>
                        </ul>
                        <p className="mt-3"><strong>d. Verification Documents</strong></p>
                        <ul>
                            <li>Government-issued ID (Passport, UMID, Driver's License) and/or selfie with ID — submitted voluntarily for identity verification</li>
                            <li>Business registration documents (for employers)</li>
                        </ul>
                        <p className="mt-3"><strong>e. Usage & Technical Data</strong></p>
                        <ul>
                            <li>Profile view counts, job application history, and saved jobs</li>
                            <li>IP address, browser type, and device information (collected automatically)</li>
                            <li>Cookies and session tokens for authentication and performance</li>
                        </ul>
                    </Section>

                    <Section title="2. How We Use Your Data">
                        <ul>
                            <li><strong>Operate the Platform</strong> — create and manage your account, show your profile to employers, process applications</li>
                            <li><strong>Verification</strong> — review submitted documents solely to grant or deny the verified badge; documents are not shared with employers</li>
                            <li><strong>Communication</strong> — send account notifications, application updates, and (where opted-in) job alerts</li>
                            <li><strong>Payments</strong> — process subscription and credit purchases through Stripe; we do not store your full card details</li>
                            <li><strong>Safety & Moderation</strong> — detect fraud, review flagged content, and enforce our Terms of Service</li>
                            <li><strong>Analytics</strong> — aggregate, anonymised usage data to improve the Platform</li>
                        </ul>
                        <p>We <strong>do not sell your personal data</strong> to third parties. Ever.</p>
                    </Section>

                    <Section title="3. Legal Basis for Processing">
                        <p>We process your personal data on the following grounds:</p>
                        <ul>
                            <li><strong>Contract performance</strong> — to provide the services you sign up for</li>
                            <li><strong>Consent</strong> — for optional features like verification and marketing emails</li>
                            <li><strong>Legitimate interests</strong> — to prevent fraud, ensure platform security, and improve our services</li>
                            <li><strong>Legal obligation</strong> — where required by Philippine law</li>
                        </ul>
                    </Section>

                    <Section title="4. Data Sharing">
                        <p>We share your data only in these circumstances:</p>
                        <ul>
                            <li><strong>With employers</strong> — your public profile (name, headline, skills, experience) is visible to employers when you apply or have a public profile. Your verification documents are <em>never</em> shared.</li>
                            <li><strong>Service providers</strong> — Supabase (database & storage), Stripe (payments), and hosting providers, each bound by data processing agreements</li>
                            <li><strong>Legal requirements</strong> — if required by a court order or Philippine government authority</li>
                            <li><strong>Business transfer</strong> — in the event of a merger or acquisition, users will be notified before data is transferred</li>
                        </ul>
                    </Section>

                    <Section title="5. Data Retention">
                        <ul>
                            <li><strong>Active accounts</strong> — data is retained for as long as your account is active</li>
                            <li><strong>Deleted accounts</strong> — personal data is deleted or anonymised within <strong>30 days</strong> of account deletion, except where retention is required by law</li>
                            <li><strong>Verification documents</strong> — deleted within <strong>14 days</strong> after the verification decision (approved or rejected)</li>
                            <li><strong>Payment records</strong> — retained for 7 years to comply with Philippine tax and accounting requirements</li>
                        </ul>
                    </Section>

                    <Section title="6. Data Security">
                        <p>We implement industry-standard security measures including:</p>
                        <ul>
                            <li>TLS/HTTPS encryption for all data in transit</li>
                            <li>AES-256 encryption for data at rest (via Supabase)</li>
                            <li>Row-Level Security (RLS) policies so users can only access their own data</li>
                            <li>Verification documents stored in private, access-controlled storage buckets</li>
                        </ul>
                        <p>No system is 100% secure. If a data breach occurs that affects your rights, we will notify you within <strong>72 hours</strong> as required by the NPC Circular.</p>
                    </Section>

                    <Section title="7. Cookies">
                        <p>We use only <strong>essential cookies</strong> — session tokens required for login and authentication. We do not use advertising or tracking cookies.</p>
                        <p>You may disable cookies in your browser settings, but this will prevent you from logging in to the Platform.</p>
                    </Section>

                    <Section title="8. Your Rights">
                        <p>Under the Philippine Data Privacy Act, you have the right to:</p>
                        <ul>
                            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
                            <li><strong>Correction</strong> — update inaccurate or incomplete data (most fields can be updated directly in your profile)</li>
                            <li><strong>Erasure</strong> — request deletion of your account and personal data</li>
                            <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
                            <li><strong>Object</strong> — object to processing based on legitimate interests</li>
                            <li><strong>Withdraw consent</strong> — for any processing based on consent, at any time</li>
                        </ul>
                        <p>To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#AC3B61] hover:underline font-bold">{CONTACT_EMAIL}</a>. We will respond within <strong>15 business days</strong>.</p>
                    </Section>

                    <Section title="9. Children's Privacy">
                        <p>TeamoraPH is not intended for users under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has created an account, please contact us and we will delete the account promptly.</p>
                    </Section>

                    <Section title="10. Third-Party Links">
                        <p>Job listings and company profiles may contain links to external websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies before providing any information.</p>
                    </Section>

                    <Section title="11. Changes to This Policy">
                        <p>We may update this Privacy Policy periodically. We will notify you of material changes by email or through a notice on the Platform at least <strong>7 days before</strong> the changes take effect. Continued use of the Platform after changes constitutes acceptance.</p>
                    </Section>

                    <Section title="12. Contact & Data Protection Officer">
                        <p>For privacy-related inquiries, requests, or complaints:</p>
                        <p className="mt-2">
                            <strong>TeamoraPH — Data Protection Officer</strong><br />
                            Cebu City, Philippines<br />
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#AC3B61] hover:underline font-bold">{CONTACT_EMAIL}</a>
                        </p>
                        <p className="mt-3">You also have the right to file a complaint with the <strong>National Privacy Commission (NPC)</strong> of the Philippines at <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-[#AC3B61] hover:underline font-bold">privacy.gov.ph</a> if you believe your data rights have been violated.</p>
                    </Section>

                    <div className="pt-6 border-t border-[#123C69]/10 flex flex-wrap gap-4 text-sm font-semibold">
                        <Link href="/terms" className="text-[#AC3B61] hover:underline">Terms of Service</Link>
                        <Link href="/" className="text-[#123C69]/60 hover:underline">← Back to Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-[#123C69] tracking-tight">{title}</h2>
            <div className="text-[#123C69]/75 leading-relaxed font-medium space-y-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul_li]:leading-relaxed">
                {children}
            </div>
        </section>
    );
}
