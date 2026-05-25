export default function FAQPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Frequently Asked Questions</h1>
      <div className="space-y-4 text-gray-700 dark:text-gray-300">
        <div>
          <h2 className="font-semibold">Is my deposit safe?</h2>
          <p>Yes. Deposits are held in escrow and adjusted only after admin review.</p>
        </div>
        <div>
          <h2 className="font-semibold">Who can use CampusRent?</h2>
          <p>Verified students and local vendors approved by the platform.</p>
        </div>
      </div>
    </div>
  )
}
