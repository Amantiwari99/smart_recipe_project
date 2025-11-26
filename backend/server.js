import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import recipesData from "./data/recipes.json" assert { type: "json" };

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: "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"
});

// ---------------------------
// GET ALL RECIPES
// ---------------------------
app.get("/api/recipes", (req, res) => {
  res.json(recipesData);
});

// ---------------------------
// SEARCH RECIPES
// ---------------------------
app.get("/api/search", (req, res) => {
  let { ingredients, diet, maxTime } = req.query;

  ingredients = ingredients
    ? ingredients.toLowerCase().split(",").map(i => i.trim())
    : [];

  const results = recipesData.filter(recipe => {
    const hasIngredients = ingredients.every(ing =>
      recipe.ingredients.join(" ").toLowerCase().includes(ing)
    );

    const hasDiet = diet ? recipe.diet === diet : true;
    const hasTime = maxTime ? recipe.time <= Number(maxTime) : true;

    return hasIngredients && hasDiet && hasTime;
  });

  res.json(results);
});

// ---------------------------
// IMAGE INGREDIENT DETECTION
// ---------------------------
app.post("/api/detect", upload.single("image"), async (req, res) => {
  try {
    const imgPath = req.file.path;
    const base64 = fs.readFileSync(imgPath).toString("base64");

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the FOOD ingredients in this image. If no food is present, reply exactly 'NO_INGREDIENTS'."
            },
            {
              type: "image_url",
              image_url: "data:image/jpeg;base64," + base64
            }
          ]
        }
      ]
    });

    const text = result.choices[0].message.content.trim();

    if (text === "NO_INGREDIENTS") {
      fs.unlinkSync(imgPath);
      return res.json({ ingredients: [] });
    }

    const ingredients = text
      .split(",")
      .map(item => item.trim());

    res.json({ ingredients });

    fs.unlinkSync(imgPath);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ---------------------------
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
