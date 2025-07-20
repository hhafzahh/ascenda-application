//express app entry for hotel service
const app = require("./app");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Hotel Service running at http://localhost:${PORT}`);
});