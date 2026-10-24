const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const Hospital = require('../src/models/Hospital');
const Doctor = require('../src/models/Doctor');

// Load env vars
dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medibridge';

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai'];
const types = ['government', 'private', 'ngo', 'clinic'];
const specs = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'General Medicine'];
const doctorNames = ['Dr. Smith', 'Dr. Jones', 'Dr. Patil', 'Dr. Sharma', 'Dr. Iyer', 'Dr. Singh', 'Dr. Reddy', 'Dr. Gupta', 'Dr. Desai'];

async function seedHospitals() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    await Hospital.deleteMany({});
    await Doctor.deleteMany({});

    console.log('Cleared existing hospitals and doctors.');

    let hospitalCount = 0;
    let doctorCount = 0;

    for (let i = 0; i < 20; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const numDocs = Math.floor(Math.random() * 3) + 3; // 3 to 5 doctors

      const hospital = await Hospital.create({
        name: `City ${city} ${type.charAt(0).toUpperCase() + type.slice(1)} Hospital ${i+1}`,
        type,
        specializations: [specs[Math.floor(Math.random() * specs.length)], specs[Math.floor(Math.random() * specs.length)]],
        address: {
          street: `${Math.floor(Math.random() * 100) + 1} Main Street`,
          city,
          state: 'State',
          pincode: '400001',
          coordinates: { lat: 19.0 + (Math.random() * 0.1), lng: 72.8 + (Math.random() * 0.1) }
        },
        phone: '9999999999',
        email: `contact@hospital${i}.com`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        totalBeds: Math.floor(Math.random() * 400) + 50,
        emergencyAvailable: Math.random() > 0.5,
        isVerified: true
      });
      hospitalCount++;

      for (let j = 0; j < numDocs; j++) {
        await Doctor.create({
          name: doctorNames[Math.floor(Math.random() * doctorNames.length)] + ' ' + (j+1),
          specialization: specs[Math.floor(Math.random() * specs.length)],
          qualification: 'MBBS, MD',
          experience: Math.floor(Math.random() * 20) + 2,
          hospitalId: hospital._id,
          consultationFee: Math.floor(Math.random() * 1500) + 300,
          availability: {
            days: ['Monday', 'Wednesday', 'Friday'],
            hours: '10:00 AM - 04:00 PM'
          },
          rating: (Math.random() * 2 + 3).toFixed(1),
        });
        doctorCount++;
      }
    }

    console.log(`Seeding complete. Created ${hospitalCount} hospitals and ${doctorCount} doctors.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedHospitals();
