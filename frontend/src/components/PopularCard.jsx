function PopularCard({ item }) {
  return (
    <div className="popular-card">
      <img src={item.image} alt={item.name} />
      <h4>{item.name}</h4>
      <p>{item.price}</p>
    </div>
  );
}

export default PopularCard;
