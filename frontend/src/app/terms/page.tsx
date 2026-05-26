import Link from "next/link"
export default function TermsPage() {
  return (
    <div className="container py-16 max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-black text-gray-900 dark:text-white">Terms of Service</h1>
      <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
        <p>By using Lease, you agree to these terms. Lease is a student-only rental marketplace.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">1. Eligibility</h2>
        <p>Only verified students with valid institutional emails may use Lease.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">2. Rentals &amp; Payments</h2>
        <p>Payments are processed through Razorpay escrow. Deposits are refundable upon item return.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">3. Damage &amp; Liability</h2>
        <p>Renters are responsible for items during the rental period.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">4. Disputes</h2>
        <p>Disputes are resolved through our internal process with evidence review.</p>
      </div>
      <Link href="/" className="text-primary-600 font-bold hover:underline">Back to Home</Link>
    </div>
  )
}