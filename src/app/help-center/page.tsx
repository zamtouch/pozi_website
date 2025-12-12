import Link from 'next/link';
import { 
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  UserIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export default function HelpCenterPage() {
  const faqSections = [
    {
      title: 'GENERAL',
      icon: InformationCircleIcon,
      questions: [
        {
          q: 'What is Pozi?',
          a: 'Pozi is a student accommodation platform that helps students find verified housing and enables property owners to collect rent through a secure monthly debit order system. It removes manual payments, reduces missed rentals, and makes the entire leasing process easier.',
        },
        {
          q: 'How much does Pozi cost?',
          a: 'Pozi charges 1% per successful debit order transaction for the first year. From year two onwards, the fee becomes 2%. There are no sign-up or listing fees.',
        },
        {
          q: 'Is Pozi safe to use?',
          a: 'Yes. All debit orders are processed through secure, bank-approved channels. Properties are reviewed before being published to ensure they meet minimum quality and safety standards.',
        },
      ],
    },
    {
      title: 'FOR STUDENTS',
      icon: UserIcon,
      questions: [
        {
          q: 'How do I apply for a room?',
          a: (
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Sign up on Pozi.</li>
              <li>Browse properties near your campus.</li>
              <li>Select a room and submit an application.</li>
              <li>Once the owner accepts your application, complete the debit order setup.</li>
              <li>Your room is confirmed once the mandate is approved.</li>
            </ol>
          ),
        },
        {
          q: 'Do I pay any fees as a student?',
          a: 'No. Using Pozi is free for students. You only pay your standard rent and deposits directly to the owner as part of the process.',
        },
        {
          q: 'How does the debit order work?',
          a: 'You approve a once-off digital mandate allowing Pozi to debit your account monthly for rent. The debit runs on the agreed date every month. A payment confirmation is visible in your dashboard.',
        },
        {
          q: 'What if I don\'t have funds in my account on debit day?',
          a: 'The debit order will fail, and both you and the property owner will be notified. Pozi may attempt a retry. You must ensure that arrears are settled quickly to avoid penalties or termination of your room agreement.',
        },
        {
          q: 'Can I cancel my debit order?',
          a: 'No. You cannot cancel the debit order without the property owner\'s approval. Rental agreements are legally binding, and cancellation must follow your lease terms.',
        },
        {
          q: 'What if I need to move out early?',
          a: 'Speak to your property owner. Early exit terms depend on your lease agreement, not Pozi. Once approved, the debit order can be stopped for future months.',
        },
        {
          q: 'Can bursary or sponsor payments be linked to Pozi?',
          a: 'Yes. You can upload your bursary documentation, and sponsors can use Pozi records as proof of accommodation and payments.',
        },
      ],
    },
    {
      title: 'FOR PROPERTY OWNERS',
      icon: HomeIcon,
      questions: [
        {
          q: 'How do I list my property?',
          a: (
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Create an owner account.</li>
              <li>Add your property details, photos, pricing, and student rules.</li>
              <li>Submit for verification.</li>
              <li>Once approved, your property goes live.</li>
            </ol>
          ),
        },
        {
          q: 'What documents do I need to verify my property?',
          a: 'A clear address, ID, bank details, and proof of ownership (or management authority). Additional documents may be requested for safety compliance.',
        },
        {
          q: 'When do I get paid?',
          a: 'Once debit orders are successful, Pozi transfers the rent to your bank account minus the service fee. You can track all payments on your Owner Dashboard.',
        },
        {
          q: 'What if a tenant\'s debit order fails?',
          a: 'You will be notified immediately. Pozi retries where possible and provides a full payment history and arrears report. Owners can manage the situation based on their lease agreement.',
        },
        {
          q: 'Can I set my own rental amount and rules?',
          a: (
            <div>
              <p className="mb-2">Yes. You control:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>monthly rent,</li>
                <li>deposit amounts,</li>
                <li>house rules,</li>
                <li>lease duration.</li>
              </ul>
              <p className="mt-2">Pozi simply facilitates the process and payments.</p>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#005b42' }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
              <QuestionMarkCircleIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about Pozi
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {faqSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <div key={sectionIndex} className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center gap-4 pb-4 border-b-2 border-green-200">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-blue-500">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {section.questions.map((faq, faqIndex) => (
                    <div
                      key={faqIndex}
                      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 lg:p-8 hover:shadow-lg transition-shadow duration-200"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-start gap-3">
                        <span className="text-green-600 font-semibold flex-shrink-0">
                          {sectionIndex === 0 
                            ? faqIndex + 1 
                            : sectionIndex === 1 
                            ? faqIndex + 4 
                            : faqIndex + 11}.
                        </span>
                        <span>{faq.q}</span>
                      </h3>
                      <div className="text-gray-700 leading-relaxed ml-8">
                        {typeof faq.a === 'string' ? <p>{faq.a}</p> : faq.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-16 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 lg:p-12 border border-green-100">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Still Need Help?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Can\'t find what you\'re looking for? Get in touch with our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Contact Support
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-semibold rounded-xl border-2 border-green-600 hover:bg-green-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

