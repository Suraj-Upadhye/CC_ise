const express = require("express");
const dotenv = require("dotenv");
const { connectDB, getMongoStatus } = require("./src/config/db");
const { ALL_RESTAURANTS } = require("./src/data/restaurants");
const Feedback = require("./src/models/Feedback");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const fallbackFeedbackStore = [];

app.use(express.json());

const normalizeMeal = (mealType = "All") =>
  typeof mealType === "string" ? mealType.trim() : "All";

app.get("/", (req, res) => {
  res.send("CityWise Food Explorer API is running.");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongoConnected: getMongoStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/cities", (req, res) => {
  const cities = [...new Set(ALL_RESTAURANTS.map((item) => item.city))].sort();
  res.json({ cities });
});

app.get("/api/restaurants", (req, res) => {
  const city = (req.query.city || "").toString().trim();
  const mealType = normalizeMeal(req.query.mealType || "All");
  const maxPrice = Number(req.query.maxPrice || 2000);
  const minRating = Number(req.query.minRating || 0);

  let filtered = ALL_RESTAURANTS;

  if (city) {
    filtered = filtered.filter(
      (restaurant) => restaurant.city.toLowerCase() === city.toLowerCase(),
    );
  }

  if (mealType !== "All") {
    filtered = filtered.filter((restaurant) =>
      restaurant.meal_types.includes(mealType),
    );
  }

  filtered = filtered.filter(
    (restaurant) =>
      restaurant.price_per_person <= maxPrice && restaurant.rating >= minRating,
  );

  res.json({
    count: filtered.length,
    items: filtered,
  });
});

app.post("/api/feedback", async (req, res) => {
  try {
    const email = (req.body.email || "").toString().trim();
    const message = (req.body.message || "").toString().trim();

    if (!email || !message) {
      return res
        .status(400)
        .json({ message: "Email and message are required." });
    }

    if (getMongoStatus()) {
      const saved = await Feedback.create({ email, message });
      return res.status(201).json({
        message: "Feedback submitted successfully.",
        id: saved._id,
      });
    }

    fallbackFeedbackStore.push({
      id: fallbackFeedbackStore.length + 1,
      email,
      message,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Feedback submitted successfully.",
      mode: "in-memory",
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not submit feedback." });
  }
});

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
