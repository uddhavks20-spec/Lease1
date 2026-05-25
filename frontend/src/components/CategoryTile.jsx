import { Link } from "react-router-dom";

function CategoryTile({ category }) {
  return (
    <Link to={`/category/${category.id}`} className="category-card">
      <img src={category.image} alt={category.name} />
      <div className="overlay">
        <h3>{category.name}</h3>
      </div>
    </Link>
  );
}

export default CategoryTile;
