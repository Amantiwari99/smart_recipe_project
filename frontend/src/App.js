import React, { useEffect, useState } from 'react';
import "./style.css";

const API = 'http://localhost:5000';

function App() {

  // ✅ Image detection hooks
  const [selectedImage, setSelectedImage] = useState(null);
  const [imgIngredients, setImgIngredients] = useState([]);

  function handleImageUpload(e) {
    setSelectedImage(e.target.files[0]);
  }

  async function detectIngredients() {
    if (!selectedImage) return alert("Please upload an image");

    const formData = new FormData();
    formData.append("image", selectedImage);

    const res = await fetch("http://localhost:5000/api/detect", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // ❌ If AI failed
    if (!data.ingredients || data.ingredients.length === 0 || data.error) {
      alert("❌ AI could not detect food ingredients in the image.");
      setImgIngredients([]);
      return;
    }

    // ✔ AI detected ingredients
    setImgIngredients(data.ingredients);

    // ✔ Auto-fill to textbox
    setIngredientsText(data.ingredients.join(", "));

    // ✔ Auto search
    search();
  }


  // ⭐ Original states
  const [allRecipes, setAllRecipes] = useState([]);
  const [ingredientsText, setIngredientsText] = useState('');
  const [results, setResults] = useState([]);
  const [diet, setDiet] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fav')) || []; }
    catch { return []; }
  });

  // Load all recipes
  useEffect(() => {
    fetch(API + '/api/recipes')
      .then(r => r.json())
      .then(setAllRecipes);
  }, []);

  // Search function
  function search() {
    const q = [];
    if (ingredientsText) q.push('ingredients=' + encodeURIComponent(ingredientsText));
    if (diet) q.push('diet=' + encodeURIComponent(diet));
    if (maxTime) q.push('maxTime=' + encodeURIComponent(maxTime));

    const url = API + '/api/search' + (q.length ? ('?' + q.join('&')) : '');

    fetch(url)
      .then(r => r.json())
      .then(setResults)
      .catch(() => alert("❌ Backend not running!"));
  }

  function toggleFavorite(id) {
    const next = favorites.includes(id)
      ? favorites.filter(x => x !== id)
      : [...favorites, id];

    setFavorites(next);
    localStorage.setItem("fav", JSON.stringify(next));
  }

  return (
    <div className="container">
      <h1 className="title">Smart Recipe Generator</h1>

      <div className="main-layout">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <h3 className="section-title">Enter Ingredients</h3>

          <textarea
            value={ingredientsText}
            onChange={e => setIngredientsText(e.target.value)}
            placeholder="Example: egg, butter, tomato"
            className="input-box"
          />

          {/* IMAGE UPLOAD SECTION */}
          <div className="option-block">
            <label>Upload Ingredient Image:</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <button onClick={detectIngredients}>Detect Ingredients</button>

            {Array.isArray(imgIngredients) && imgIngredients.length > 0 && (
              <p><strong>Detected:</strong> {imgIngredients.join(", ")}</p>
            )}
          </div>

          <div className="options-row">
            <div className="option-block">
              <label>Diet:</label>
              <select value={diet} onChange={e => setDiet(e.target.value)}>
                <option value="">Any</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-free</option>
              </select>
            </div>

            <div className="option-block">
              <label>Max Time (min):</label>
              <input
                type="number"
                value={maxTime}
                onChange={e => setMaxTime(e.target.value)}
              />
            </div>
          </div>

          <button className="search-btn" onClick={search}>
            🔍 Find Recipes
          </button>

          <h3 className="section-title">Favorites</h3>
          <ul className="fav-list">
            {favorites.map(id => {
              const r = allRecipes.find(x => x.id === id);
              return r ? <li key={id}>❤️ {r.name}</li> : null;
            })}
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <h3 className="section-title">Results</h3>

          {results.length === 0 && (
            <p className="no-results">No recipes yet. Try searching.</p>
          )}

          {results.map(r => (
            <div key={r.id} className="recipe-card">
              <div className="recipe-header">
                <h2>{r.name}</h2>
                <button
                  className="fav-btn"
                  onClick={() => toggleFavorite(r.id)}
                >
                  {favorites.includes(r.id) ? "💔 Unfavorite" : "❤️ Favorite"}
                </button>
              </div>

              <p className="recipe-sub">
                <strong>Time:</strong> {r.time} min &nbsp; | &nbsp;
                <strong>Diet:</strong> {r.diet}
              </p>

              <p><strong>Ingredients:</strong> {r.ingredients.join(", ")}</p>

              <p><strong>Steps:</strong></p>
              <ol className="step-list">
                {r.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>

              {/* Nutrition */}
              <p><strong>Nutrition:</strong></p>
              <ul className="nutrition-list">
                <li>Calories: {r.nutrition.calories}</li>
                <li>Protein (per 100g): {r.nutrition.protein_per_100g} g</li>
                <li>Carbs (per 100g): {r.nutrition.carbs_per_100g || 0} g</li>
              </ul>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
