export default function CategoryPage({ params }: { params: { slug: string } }) {

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold capitalize">
        {params.slug} Rentals
      </h1>

      <p className="text-gray-500 mt-2">
        Items available in this category
      </p>

    </div>

  )

}
