require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const autoSeedDatabase = require('./seed/autoSeed');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await autoSeedDatabase();
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
});
