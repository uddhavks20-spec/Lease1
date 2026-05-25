import { categories, popularItems } from "../data/categories";
import CategoryTile from "../components/categorytile.jsx";
import PopularCard from "../components/PopularCard.jsx";    

function Home() {
  return (
    <div>

      <h1>Rent Anything for College Life</h1>

      <h2>🔥 Popular Rentals</h2>
      <div className="popular-grid">
        {popularItems.map(item => (
          <PopularCard key={item.id} item={item} />
        ))}
      </div>

      <h2>Browse Categories</h2>
      <div className="category-grid">
        {categories.map(cat => (
          <CategoryTile key={cat.id} category={cat} />
        ))}
      </div>

    </div>
  );
}

export default Home;
