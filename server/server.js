const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const { exec } = require("child_process");
const app = require("./app");

// Load environment variables from .env
dotenv.config();

// Mount your existing routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/questions", require("./routes/question"));

/**
 * /run-python
 * Expects query parameters:
 *   - age        (string or number)
 *   - description (string)
 * You can extend this to accept brand/market/allergies via query too.
 */
app.get("/run-python", (req, res) => {
  const { age = "nan", description = "", allergies = "" } = req.query;
  const script = path.join(__dirname, "check.py");

  // You can also promote these to query params if you like
  const brand = "Vega";
  const market = "true";

  // Build and escape the command
  const cmd = [
    "python",
    `"${script}"`,
    `"${age}"`,
    `"${brand}"`,
    `"${market}"`,
    `"${description.replace(/"/g, '\\"')}"`,
    `"${allergies}"`
  ].join(" ");

  console.log("Executing:", cmd);

  exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
    if (err) {
      console.error("Execution error:", stderr || err.message);
      return res.status(500).json({ error: stderr || err.message });
    }
    try {
      const result = JSON.parse(stdout);
      return res.json(result);
    } catch (parseError) {
      console.error("Invalid JSON from Python:", stdout);
      return res.status(500).json({ error: "Invalid JSON from Python", raw: stdout });
    }
  });
});

// npm install node-fetch@2
const fetch = require("node-fetch");

app.get("/pdf-proxy", async (req, res) => {
  const id = req.query.id;
  console.log("PDF Proxy ID:", id);
  if (!id) return res.status(400).send("Missing id");
  const url = `https://api.ods.od.nih.gov/dsld/s3/pdf/${id}.pdf`;
  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(502).send("Upstream error");
    res.set("Content-Type", "application/pdf");
    upstream.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy error");
  }
});


// Connect to MongoDB and start server
const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => {
    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
  })
  .catch((error) => console.error("Mongo connection error:", error));

module.exports = app;
