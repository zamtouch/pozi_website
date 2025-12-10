'use client';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="py-16" style={{ backgroundColor: '#fce7f3' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ color: '#005b42' }}>
            Terms & Conditions
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8 text-gray-700 leading-relaxed">
              
              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>1. Introduction</h2>
                <p>
                  Pozi (<em>"the Service"</em>) operates an online platform that connects property owners with potential tenants (often students). By accessing the Pozi website or mobile application, you (<em>"user"</em>) agree to be bound by these Terms & Conditions. Pozi acts as a facilitator—it provides the digital marketplace and payment infrastructure but is not a party to any lease. Property owners and tenants remain responsible for negotiating and fulfilling their respective contractual obligations. If you do not agree with these Terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>2. Eligibility and Account Creation</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Age and Legal Capacity</strong> – You must be at least 18 years old and have capacity to enter into binding agreements. Users under 18 may use the Service only with the consent of a parent or legal guardian.</li>
                  <li><strong>Registration</strong> – To list property or to rent, you must create an account. You agree to provide accurate, current and complete information during registration and to keep your account information updated. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
                  <li><strong>Verification</strong> – Pozi may require you to provide identification documents or proof of property ownership. The Service reserves the right to suspend or terminate accounts that fail to provide requested verification or submit false information.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>3. Description of Services</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Listing Services</strong> – Property owners can advertise residential accommodations on the platform. Owners are responsible for the accuracy of listing details, compliance with housing standards, and ensuring that their properties are safe, habitable and provide uninterrupted access to basic utilities such as water and electricity. Owners must keep the properties in good working order and promptly perform repairs.</li>
                  <li><strong>Facilitation and Management Fee</strong> – Pozi charges property owners a 2% facilitation and project–management fee for each lease arranged through the platform. This fee covers marketing, tenant–onboarding, contract management, and basic support services. It will be deducted from rental payments or invoiced separately.</li>
                  <li><strong>Tenant Services</strong> – Tenants can search for accommodation, reserve a room and sign a rental agreement electronically. Tenants must supply accurate personal information and consent to the required credit or background checks. The platform may require a security deposit at the time of booking.</li>
                  <li><strong>Payments</strong> – Rental payments are processed via debit order or other approved payment method. To ensure timely payments, tenants must maintain an active bank account or payment method. Closing an account or otherwise blocking a debit order to avoid payment is considered a material breach and may lead to termination of the tenancy following applicable laws and due process.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>4. Obligations of Property Owners</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Utilities and Maintenance</strong> – Property owners are responsible for paying or arranging all utilities (e.g., water, electricity, waste collection) and for routine maintenance of the property. They must fix defects and ensure that heating, plumbing, electrical systems and other vital elements are functional throughout the tenancy. Any failure to provide essential services may entitle tenants to seek remedies under applicable law.</li>
                  <li><strong>Compliance</strong> – Owners must comply with relevant housing, safety, data–protection and anti‑discrimination laws. Listings must be free of misleading information and must not contravene local zoning or licencing rules. Pozi may remove listings that violate these requirements.</li>
                  <li><strong>Insurance</strong> – Owners are encouraged to maintain appropriate property and liability insurance.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>5. Obligations of Tenants (Students)</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Payment of Rent</strong> – Tenants must pay rent in full by the due date specified in the lease (normally on or before the 5th day of each month). Late payments will incur a penalty of N$200 which may be deducted from the tenant's deposit.</li>
                  <li><strong>Security Deposit and Breakages</strong> – A security deposit may be collected to cover potential damages and unpaid charges. Costs for breakages or missing items will be deducted from the deposit at the end of the lease. Any remaining balance will be returned within a reasonable period (typically within 30 days) after the property is inspected and all accounts are settled.</li>
                  <li><strong>Property Care</strong> – Tenants must use the premises responsibly, keep it reasonably clean, avoid damage or misuse, and comply with any house rules or statutory regulations. Tenants may not undertake illegal activities or sublet without written consent from the owner.</li>
                  <li><strong>No Circumvention of Payment</strong> – Intentionally closing or changing a bank account or payment method to circumvent a debit order constitutes a breach. If a tenant does so, the owner may initiate eviction proceedings in accordance with applicable landlord–tenant laws and Pozi may terminate the tenant's account.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>6. Termination and Eviction</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>By Property Owner</strong> – Owners may terminate a lease for material breaches such as non‑payment, repeated late payment, property damage or illegal conduct. Eviction must follow the legal process in the jurisdiction where the property is located and provide any required notices. Immediate eviction without due process is not permitted.</li>
                  <li><strong>By Tenant</strong> – Tenants may terminate the lease according to the notice periods set out in the contract. Early termination may result in forfeiture of part of the deposit or other charges as described in the lease agreement.</li>
                  <li><strong>By Pozi</strong> – Pozi may suspend or terminate a user's account and/or remove listings for violation of these Terms, fraudulent activity, abuse of the platform or non‑compliance with legal obligations. Pozi will provide reasonable notice unless immediate termination is justified to protect other users or comply with law.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>7. Legal Action and Dispute Resolution</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Breach of Agreement</strong> – Pozi and property owners reserve the right to seek legal remedies—including mediation, arbitration or court action—in cases of breach of these Terms or the lease agreement. Legal fees and costs may be recoverable as permitted by law.</li>
                  <li><strong>Disputes Between Users</strong> – Any dispute between property owners and tenants relating to the lease should be addressed directly between the parties. Pozi can assist with communication but is not responsible for resolving disputes unless expressly stated.</li>
                  <li><strong>Governing Law</strong> – Unless otherwise specified in a written agreement, these Terms are governed by the laws of Namibia (or the country in which the property is located). You consent to the jurisdiction of the courts of that country.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>8. Limitation of Liability</h2>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Platform As‑Is</strong> – The Service, its content and materials are provided <em>"as is"</em>. While Pozi strives to ensure accuracy, it does not warrant that the platform will be error free, uninterrupted or that defects will always be corrected.</li>
                  <li><strong>No Responsibility for Properties</strong> – Pozi is not the owner or manager of listed properties and is not responsible for the condition, safety or legality of the accommodation. Any damages, losses or claims arising from the condition of a property are the responsibility of the property owner.</li>
                  <li><strong>Liability Cap</strong> – To the maximum extent permitted by law, Pozi's liability to any user for any damages will be limited to the total facilitation fee received by Pozi from that user during the 12 months preceding the claim. Pozi is not liable for indirect, incidental or consequential damages.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>9. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless Pozi and its affiliates, directors, employees and agents from any claims, damages, liabilities, losses and expenses (including legal fees) arising out of your use of the Service, violation of these Terms or violation of any rights of another person.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>10. Changes to These Terms</h2>
                <p>
                  Pozi may modify these Terms from time to time. Changes will be posted on the Pozi website or app. If you continue to use the Service after changes become effective, you will be deemed to have accepted the updated Terms. If you do not agree with any modification, you must stop using the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>11. Contact Information</h2>
                <p>
                  If you have questions or complaints regarding these Terms or the Service, please contact Pozi at:
                </p>
                <p className="mt-4">
                  <strong>Email:</strong> <a href="mailto:support@pozi.com.na" className="text-green-600 hover:underline">support@pozi.com.na</a>
                </p>
                <p className="mt-2">
                  <strong>Address:</strong> [Insert mailing address here]
                </p>
              </section>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


