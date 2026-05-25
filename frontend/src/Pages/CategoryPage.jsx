import { useParams } from "react-router-dom";
import { categories } from "../data/categories";
import { Link } from "react-router-dom";

function CategoryPage() {

  const { id } = useParams();
  const category = categories.find(c => c.slug === id);

  return (
    <div>
      <h1>{category.name}</h1>

      <div className="subcategory-grid">
        {category.subcategories.map(sub => (
          <Link
            key={sub.id}
            to={`/category/${id}/${sub.id}`}
            className="subcategory-card"
          >
            {sub.name}
          </Link>
        ))}
      </div>

    </div>
  );
}

export default CategoryPage;
