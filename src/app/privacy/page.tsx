'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-green-50 to-pink-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ color: '#005b42' }}>
            Privacy Policy
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
                  Pozi respects your privacy and is committed to safeguarding personal data. This policy explains what information we collect, how we use it, and the choices you have. It applies to information we collect via the Pozi website or mobile app and through related services. Apple's App Review Guidelines require every app to include a privacy policy that identifies what data is collected, how it is collected, all uses of that data, confirms third‑party protections and explains retention and deletion policies (<a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">developer.apple.com</a>). Similarly, the Google Play User Data Policy requires developers to be transparent about the access, collection, use, handling and sharing of user data and to limit the use of personal data to disclosed, policy‑compliant purposes (<a href="https://support.google.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">support.google.com</a>). The following sections satisfy those requirements and align with the principles of the Zambian Data Protection Act, which stipulates that personal data must be processed lawfully, collected for explicit purposes, kept accurate and only retained as necessary (<a href="https://securiti.ai" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">securiti.ai</a>).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>2. Data We Collect</h2>
                <p className="mb-4">
                  We collect information that you provide directly, data generated through your use of the Service and information from third parties. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Personal Identification Information</strong> – such as your name, email address, postal address, phone number, national identity or passport number, student or employee identification and other identifiers you provide when registering or applying for tenancy.</li>
                  <li><strong>Account Credentials</strong> – login username and hashed password.</li>
                  <li><strong>Financial Information</strong> – Pozi collects only the bank account number, bank name and branch information you provide so that we can arrange rent and deposit payments via debit order. We do not collect or store electronic card details (credit or debit card numbers, expiry dates or CVV codes), and we do not retain sufficient information to initiate unauthorized withdrawals. Our payment processor uses your account details solely to carry out authorised transactions.</li>
                  <li><strong>Property & Lease Information</strong> – details about properties you list or rent, lease terms, rental amounts and payment history.</li>
                  <li><strong>Usage Data</strong> – information about how you interact with our platform, such as device information, log data, IP addresses, operating system, browser type, and pages viewed. We may use cookies and similar technologies to collect this information.</li>
                  <li><strong>Third‑Party Data</strong> – information from credit bureaus or verification services (with your consent) and data from service providers such as payment processors.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>3. How We Collect Data</h2>
                <p className="mb-4">We collect data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>When you interact with the platform</strong> – e.g., when you create an account, submit a listing, apply for accommodation, make payments or communicate with us.</li>
                  <li><strong>Automatically</strong> – via cookies and device technologies that log usage information. You can manage cookie preferences in your browser or device settings.</li>
                  <li><strong>From third parties</strong> – such as identity verification services or payment processors, but only where you have authorised such collection.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>4. Legal Basis for Processing and How We Use Data</h2>
                <p className="mb-4">
                  Our lawful bases include consent, contractual necessity, compliance with legal obligations and legitimate interests, as recognised under the Zambian Data Protection Act (<a href="https://securiti.ai" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">securiti.ai</a>). We use your data to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Provide and manage the Service</strong> – including connecting tenants and property owners, processing bookings, facilitating payments, managing contracts and enforcing our Terms.</li>
                  <li><strong>Verify Identity</strong> – to confirm eligibility and prevent fraud. We may use third‑party verification services.</li>
                  <li><strong>Communicate with you</strong> – regarding your account, lease, updates to our policies, security alerts and marketing communications (with your consent). You may opt out of non‑essential communications.</li>
                  <li><strong>Improve our services</strong> – by analysing how users interact with the platform and identifying ways to enhance functionality and user experience. Under the Apple Guidelines, apps should request access only to data that is relevant to the core functionality and may not repurpose data without additional consent (<a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">developer.apple.com</a>).</li>
                  <li><strong>Comply with Legal Obligations</strong> – such as anti‑money laundering or tax reporting requirements and obligations to governmental authorities.</li>
                </ul>
                <p>
                  We do not sell personal data. The Google Play policy forbids selling personal or sensitive user data and requires that any data transfer to service providers be necessary and accompanied by appropriate safeguards (<a href="https://support.google.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">support.google.com</a>). We will therefore only share your data as described below.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>5. Data Sharing and Disclosure</h2>
                <p className="mb-4">We may share personal data with:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Property owners and tenants</strong> – to the extent necessary to facilitate rental agreements, viewings and communications between parties.</li>
                  <li><strong>Service providers</strong> – such as hosting providers, analytics companies, payment processors, background‑check services and customer support platforms. We require these partners to protect your data and to use it only for the purpose of providing services to us, offering the same level of protection we provide (<a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">developer.apple.com</a>).</li>
                  <li><strong>Legal and regulatory authorities</strong> – when required to comply with law, to protect the rights of Pozi or others, or to respond to lawful requests. Under the Zambian Data Protection Act, processing may be lawful when necessary for compliance with legal obligations (<a href="https://securiti.ai" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">securiti.ai</a>).</li>
                  <li><strong>Corporate transactions</strong> – if Pozi is involved in a merger, acquisition or sale, your information may be transferred as part of that transaction, subject to confidentiality obligations.</li>
                </ul>
                <p>
                  We do not share data with analytics or advertising partners for the purpose of building profiles or behavioural advertising. Apps may not repurpose personal data without further consent (<a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">developer.apple.com</a>).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>6. Data Retention</h2>
                <p>
                  We retain personal data only as long as necessary to fulfil the purposes described here, to comply with legal and regulatory obligations or to resolve disputes. When data is no longer required, we will either delete it or anonymise it. This fulfils the requirement to store data only for the necessary time period (<a href="https://securiti.ai" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">securiti.ai</a>).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>7. Security Measures</h2>
                <p>
                  We implement appropriate technical and organisational measures to secure personal data, including encryption of data in transit, secure servers, role‑based access controls and regular security assessments. We require service providers to use modern cryptography and security practices. Under the Google User Data policy, personal and sensitive user data must be handled securely (<a href="https://support.google.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">support.google.com</a>). Despite these measures, no method of transmission over the Internet is perfectly secure; you acknowledge that we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>8. Your Rights</h2>
                <p className="mb-4">Depending on your jurisdiction and subject to certain exceptions, you may have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Access</strong> – request a copy of the personal data we hold about you.</li>
                  <li><strong>Rectification</strong> – update or correct inaccurate data.</li>
                  <li><strong>Erasure</strong> – request deletion of your personal data where it is no longer needed or where consent has been withdrawn.</li>
                  <li><strong>Restriction</strong> – ask us to limit how we process your data.</li>
                  <li><strong>Objection</strong> – object to certain processing, including direct marketing.</li>
                  <li><strong>Data portability</strong> – obtain a copy of your data in a structured, commonly used, machine‑readable format.</li>
                  <li><strong>Withdraw Consent</strong> – where processing is based on consent, you may withdraw your consent at any time. Apple guidelines require apps to provide an easily accessible and understandable way to withdraw consent (<a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">developer.apple.com</a>).</li>
                  <li><strong>Lodge a Complaint</strong> – with the relevant data protection authority (e.g., the Data Protection Commission of Zambia) if you believe your rights have been violated.</li>
                </ul>
                <p>
                  To exercise these rights, please contact us using the details in the Contact section. We may require you to provide proof of identity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>9. International Transfers</h2>
                <p>
                  Your data may be transferred to and stored on servers located outside your country. In such cases, we will implement appropriate safeguards—such as standard contractual clauses or other lawful transfer mechanisms—to ensure that your data receives a level of protection equivalent to that required by local law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>10. Cookies and Tracking Technologies</h2>
                <p className="mb-4">Pozi uses cookies and similar technologies to enable the platform to function and to understand how visitors use our services. We categorise cookies as:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Essential cookies</strong> – necessary for basic site functionality (e.g., account login, session management). You cannot opt out of essential cookies.</li>
                  <li><strong>Analytics cookies</strong> – help us understand usage patterns and improve the platform. These do not personally identify you and you can disable them through your browser or device settings.</li>
                </ul>
                <p>
                  We do not use advertising or marketing cookies to track your behaviour across other sites. Apps on Apple platforms must not track users without obtaining explicit permission (<a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">developer.apple.com</a>), and we adhere to that standard.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>11. Children's Privacy</h2>
                <p>
                  Our services are intended for adults and are not directed to persons under 18 years of age. We do not knowingly collect personal data from children. If we become aware that a minor has provided us with personal information, we will delete it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>12. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on our website or app and by updating the "last updated" date. Continuing to use the Service after changes take effect constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: '#005b42' }}>13. Contact</h2>
                <p>
                  For questions or requests regarding this Privacy Policy, please contact:
                </p>
                <p className="mt-4">
                  <strong>Email:</strong> <a href="mailto:privacy@pozi.com.na" className="text-green-600 hover:underline">privacy@pozi.com.na</a>
                </p>
              </section>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


