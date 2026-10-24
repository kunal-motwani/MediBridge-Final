const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const count = await User.countDocuments();
  console.log(`There are ${count} users in the database.`);
  if (count > 0) {
    const user = await User.findOne();
    console.log(`Sample user email: ${user.email}`);
  }
  process.exit(0);
});
