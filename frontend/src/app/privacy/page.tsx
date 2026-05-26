import Link from "next/link"
export default function PrivacyPage() {
  return (
    <div className="container py-16 max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-black text-gray-900 dark:text-white">Privacy Policy</h1>
      <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
        <p>Lease respects your privacy. We collect only what is needed for verification and rentals.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">Information We Collect</h2>
        <p>Name, email, phone, institutional affiliation, and KYC documents.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">Data Security</h2>
        <p>Payment data is handled by Razorpay. We never store payment details on our servers.</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4">Contact</h2>
        <p>For privacy inquiries, contact our support team.</p>
      </div>
      <Link href="/" className="text-primary-600 font-bold hover:underline">Back to Home</Link>
    </div>
  )
}