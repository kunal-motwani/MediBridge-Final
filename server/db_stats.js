const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const models = mongoose.modelNames();
  const stats = {};
  for (const modelName of models) {
    const count = await mongoose.model(modelName).countDocuments();
    stats[modelName] = count;
  }
  
  // also explicitly get counts for our schema if modelNames() doesn't have them all registered
  // let's require all models first
  require('./src/models/User');
  require('./src/models/Hospital');
  require('./src/models/Doctor');
  require('./src/models/MedicalRecord');
  require('./src/models/Prescription');
  require('./src/models/LoanApplication');
  
  const allModels = mongoose.modelNames();
  const allStats = {};
  for (const name of allModels) {
    allStats[name] = await mongoose.model(name).countDocuments();
  }
  
  console.log(JSON.stringify(allStats, null, 2));
  process.exit(0);
}).catch(err => {
  console.error("DB connection error", err);
  process.exit(1);
});
