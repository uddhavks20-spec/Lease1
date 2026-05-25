import { useParams } from "react-router-dom";

function SubCategoryPage() {

  const { category, subcategory } = useParams();

  return (
    <div>

      <h2>
        {category} → {subcategory}
      </h2>

      <p>Items for rent will appear here.</p>

    </div>
  );
}

export default SubCategoryPage;
