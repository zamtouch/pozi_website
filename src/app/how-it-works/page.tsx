import Link from 'next/link';
import { 
  InformationCircleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: 'Property owners list their rooms',
      icon: HomeIcon,
      items: [
        'Create an account on Pozi as a property owner.',
        'Add your property: address, photos, room types, monthly rent, deposit, and house rules.',
        'Set your payment details (bank account) so Pozi can pay over collected rentals.',
        'Submit your listing for verification (basic checks that it\'s real, safe and student-ready).',
        'Once approved, your property is live and visible to students on the app.',
      ],
    },
    {
      number: 2,
      title: 'Students search for accommodation',
      icon: MagnifyingGlassIcon,
      items: [
        'Students sign up on Pozi and create a simple profile (name, school, year of study, etc.).',
        'They search by campus, area, price range or room type to see suitable options.',
        'Students view property details: photos, distance to campus, rent, what\'s included (Wi-Fi, laundry, transport, etc.).',
        'When they find a good match, they submit an application / booking request through the app.',
      ],
    },
    {
      number: 3,
      title: 'Owners review and accept tenants',
      icon: CheckCircleIcon,
      items: [
        'The owner gets a notification of the new application.',
        'They can review the student\'s profile, bursary/guarantee info (if applicable) and any supporting documents.',
        'The owner can accept, decline or ask for more info or a viewing.',
        'Once accepted, the student is notified that their room is reserved (subject to debit order setup).',
      ],
    },
    {
      number: 4,
      title: 'Debit order setup (the core of Pozi)',
      icon: CreditCardIcon,
      items: [
        'After acceptance, the app guides the student through a secure debit order setup.',
        'The student confirms their bank details and monthly rental amount in the Pozi flow.',
        'They approve the debit order mandate (usually a once-off digital authorisation).',
        'The debit order is then linked to that property and room on Pozi.',
      ],
    },
    {
      number: 5,
      title: 'Monthly payment collection',
      icon: CalendarDaysIcon,
      items: [
        'Each month, on the agreed date, Pozi sends the debit order to the student\'s bank.',
        'If successful:',
        '  • Pozi deducts its service fee (e.g. 1% in year 1, 2% afterwards).',
        '  • The balance is paid into the property owner\'s bank account.',
        'If unsuccessful (insufficient funds, etc.):',
        '  • The app notifies both student and owner.',
        '  • Pozi can retry, and keeps a record of failed attempts and arrears.',
      ],
    },
    {
      number: 6,
      title: 'Dashboards & records',
      icon: ChartBarIcon,
      items: [
        'For property owners:',
        '  • Log into your Owner Dashboard.',
        '  • See a summary of all units, who is occupying them and what they pay.',
        '  • Track which debit orders were successful, which failed, and who is in arrears.',
        '  • Download statements and reports for your own records or for the bank.',
        'For students:',
        '  • Log into your Student Dashboard.',
        '  • See your monthly rental amount, payment history and next debit date.',
        '  • Download proof of payment for bursary providers or parents.',
      ],
    },
    {
      number: 7,
      title: 'Support, feedback & improvements',
      icon: ChatBubbleLeftRightIcon,
      items: [
        'Pozi provides support if there are issues with a debit order or listing.',
        'Owners can see feedback and payment reliability trends over time.',
        'Data from debit orders and bookings helps Pozi improve matching and risk management for both parties.',
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
              <InformationCircleIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              How Pozi Works
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Step by Step Guide
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-10 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-start gap-6">
                  {/* Step Number & Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                      {step.number}. {step.title}
                    </h2>
                    <ul className="space-y-3">
                      {step.items.map((item, itemIndex) => {
                        // Check if item is a sub-item (starts with bullet or indentation)
                        const isSubItem = item.trim().startsWith('•') || item.trim().startsWith('o');
                        return (
                          <li
                            key={itemIndex}
                            className={`flex items-start gap-3 ${isSubItem ? 'ml-6' : ''}`}
                          >
                            {!isSubItem && (
                              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            )}
                            <span className="text-gray-700 leading-relaxed">{item.replace(/^[•o]\s*/, '')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 lg:p-12 border border-green-100">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Whether you\'re a property owner looking to list your rooms or a student searching for accommodation, Pozi makes it simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                List Your Property
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-semibold rounded-xl border-2 border-green-600 hover:bg-green-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Search Properties
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Contact */}
        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            ← Back to Contact
          </Link>
        </div>
      </div>
    </div>
  );
}

