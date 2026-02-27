import Link from "next/link";

export const metadata = {
    title: "Terms of Service — TeamoraPH",
    description: "Read the Terms of Service for TeamoraPH, the Philippines' remote work job board.",
};

const EFFECTIVE_DATE = "February 28, 2026";
const CONTACT_EMAIL = "legal@teamoraph.com";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#EEE2DC]">
            <div className="max-w-4xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-12">
                    <p className="text-sm font-bold text-[#AC3B61] uppercase tracking-widest mb-3">Legal</p>
                    <h1 className="text-5xl font-black text-[#123C69] tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-[#123C69]/60 font-medium">
                        Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last Updated: {EFFECTIVE_DATE}
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2rem] p-10 space-y-10 text-[#123C69]">

                    {/* Intro */}
                    <p className="text-base leading-relaxed font-medium text-[#123C69]/80">
                        Welcome to <strong>TeamoraPH</strong> ("Platform", "we", "us", or "our"). By accessing or using our website at <strong>teamoraph.com</strong>, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the Platform. TeamoraPH is a Philippine-based job board connecting remote employers with Filipino talent.
                    </p>

                    <Section title="1. Eligibility">
                        <p>You must be at least <strong>18 years old</strong> and legally allowed to work or hire in the Philippines or internationally to use this Platform. By creating an account, you confirm that all information you provide is accurate and complete.</p>
                    </Section>

                    <Section title="2. User Accounts">
                        <ul>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You may not share, sell, or transfer your account to another person.</li>
                            <li>You are fully responsible for all activity that occurs under your account.</li>
                            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                        </ul>
                    </Section>

                    <Section title="3. Candidate Responsibilities">
                        <ul>
                            <li>Your profile information — including your resume, skills, and work history — must be truthful and current.</li>
                            <li>You must not misrepresent your qualifications, credentials, or identity.</li>
                            <li>Submitting false verification documents is strictly prohibited and may result in permanent ban and legal action.</li>
                            <li>You acknowledge that applying to a job does not guarantee employment.</li>
                        </ul>
                    </Section>

                    <Section title="4. Employer Responsibilities">
                        <ul>
                            <li>Job postings must be for legitimate employment or contract opportunities. Scam or misleading listings are strictly prohibited.</li>
                            <li>You must not use the Platform to collect personal data beyond what is necessary for hiring purposes.</li>
                            <li>Free-tier employers are limited to <strong>3 job posts per month</strong>. Posts are subject to review and may be delayed or removed.</li>
                            <li>Employers are responsible for complying with all applicable labor and data privacy laws when engaging candidates.</li>
                        </ul>
                    </Section>

                    <Section title="5. Prohibited Conduct">
                        <p>You agree not to:</p>
                        <ul>
                            <li>Post spam, fraudulent, or misleading content.</li>
                            <li>Harass, threaten, or discriminate against any user.</li>
                            <li>Scrape, harvest, or copy Platform data without written permission.</li>
                            <li>Attempt to gain unauthorized access to any part of the Platform or another user's account.</li>
                            <li>Use the Platform to promote illegal activities or violate Philippine law.</li>
                        </ul>
                        <p>Violations may result in immediate account suspension without refund.</p>
                    </Section>

                    <Section title="6. Credits & Payments">
                        <ul>
                            <li><strong>Free credits</strong> are allocated daily and cannot be transferred or redeemed for cash.</li>
                            <li><strong>Purchased credits</strong> are non-refundable once used to boost an application.</li>
                            <li>Subscription fees, if applicable, are billed in advance and are non-refundable except where required by law.</li>
                            <li>We use Stripe for payment processing. By making a purchase, you agree to Stripe's terms of service.</li>
                        </ul>
                    </Section>

                    <Section title="7. Identity Verification">
                        <ul>
                            <li>Verification is <strong>voluntary</strong> but strongly encouraged. Verified profiles receive a trust badge visible to employers.</li>
                            <li>Documents submitted for verification (Government ID, selfie) are used solely for identity validation and are handled in compliance with the Philippine Data Privacy Act of 2012 (R.A. 10173).</li>
                            <li>Submitting falsified documents is a violation of these Terms and may be reported to relevant authorities.</li>
                        </ul>
                    </Section>

                    <Section title="8. Intellectual Property">
                        <p>All content, design, and technology on TeamoraPH — including logos, UI, and code — is owned by TeamoraPH and protected under applicable copyright laws. You may not reproduce, distribute, or create derivative works without our express written consent.</p>
                        <p>By submitting content (e.g., profile information, job posts) to the Platform, you grant TeamoraPH a non-exclusive, royalty-free license to display and use that content to operate the Platform.</p>
                    </Section>

                    <Section title="9. Limitation of Liability">
                        <p>TeamoraPH provides the Platform on an <strong>"as is" and "as available"</strong> basis. We make no warranties, express or implied, regarding the accuracy or availability of the Platform.</p>
                        <p>To the maximum extent permitted by Philippine law, TeamoraPH shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including but not limited to lost employment opportunities.</p>
                    </Section>

                    <Section title="10. Termination">
                        <p>You may delete your account at any time. We reserve the right to terminate or suspend your access for violations of these Terms, at our sole discretion, with or without notice.</p>
                        <p>Upon termination, your right to use the Platform ceases immediately. Sections that by their nature should survive termination will do so.</p>
                    </Section>

                    <Section title="11. Governing Law">
                        <p>These Terms are governed by the laws of the <strong>Republic of the Philippines</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts of Cebu City, Philippines.</p>
                    </Section>

                    <Section title="12. Changes to These Terms">
                        <p>We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice on the Platform. Your continued use after changes are posted constitutes acceptance of the updated Terms.</p>
                    </Section>

                    <Section title="13. Contact Us">
                        <p>For questions about these Terms, please contact us at:</p>
                        <p className="mt-2">
                            <strong>TeamoraPH</strong><br />
                            Cebu City, Philippines<br />
                            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#AC3B61] hover:underline font-bold">{CONTACT_EMAIL}</a>
                        </p>
                    </Section>

                    <div className="pt-6 border-t border-[#123C69]/10 flex flex-wrap gap-4 text-sm font-semibold">
                        <Link href="/privacy" className="text-[#AC3B61] hover:underline">Privacy Policy</Link>
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
