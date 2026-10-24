const mongoose = require('mongoose');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Doctor = require('../src/models/Doctor');
const MedicalRecord = require('../src/models/MedicalRecord');
const EmergencyProfile = require('../src/models/EmergencyProfile');
const Prescription = require('../src/models/Prescription');
const AccessSession = require('../src/models/AccessSession');

/**
 * Automatically seeds the in-memory MongoDB database on server boot
 * so the web portal has immediate sample accounts, doctors, hospitals,
 * privacy-flagged records, and emergency profiles ready for demonstration.
 */
async function autoSeedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already contains records. Skipping auto-seed.');
      return;
    }

    console.log('Seeding initial demo data into MediBridge database...');

    // 1. Create Apollo Hospital first so doctors have a valid hospitalId
    const hospital1 = await Hospital.create({
      name: 'Apollo Multispecialty Hospital',
      type: 'private',
      specializations: ['Cardiology', 'Neurology', 'Oncology', 'General Medicine'],
      address: {
        street: '154, Bannerghatta Main Rd',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560076',
        coordinates: { lat: 12.894, lng: 77.598 }
      },
      phone: '080-26304050',
      email: 'contact@apollo-bangalore.com',
      rating: 4.8,
      totalBeds: 350,
      emergencyAvailable: true,
      isVerified: true
    });

    // 2. Create Doctor catalog items
    const docAarav = await Doctor.create({
      name: 'Dr. Aarav Sharma',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD, DM (Cardiology)',
      experience: 12,
      hospitalId: hospital1._id,
      consultationFee: 800,
      availability: { days: ['Monday', 'Tuesday', 'Thursday', 'Friday'], hours: '09:00 AM - 02:00 PM' },
      rating: 4.9
    });

    await Doctor.create({
      name: 'Dr. Sneha Kulkarni',
      specialization: 'Neurology',
      qualification: 'MBBS, MD (Medicine), DM (Neurology)',
      experience: 9,
      hospitalId: hospital1._id,
      consultationFee: 750,
      availability: { days: ['Wednesday', 'Thursday', 'Saturday'], hours: '10:00 AM - 04:00 PM' },
      rating: 4.7
    });

    // 3. Create Doctor Login User (Dr. Aarav Sharma)
    const demoDoctor = await User.create({
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'doctor@demo.com',
      password: 'password123',
      phone: '9876543210',
      role: 'doctor',
      doctorProfile: {
        specialization: 'Cardiology',
        licenseNumber: 'MCI-2024-99881',
        hospitalAffiliation: 'Apollo Multispecialty Hospital',
        hospitalId: hospital1._id, // LINKED TO APOLLO HOSPITAL
        yearsOfExperience: 12,
        isVerified: true
      }
    });

    // 4. Create Demo Patient 1: Rahul Sharma
    const demoPatient = await User.create({
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'patient@demo.com',
      password: 'password123',
      phone: '9876543211',
      role: 'patient',
      gender: 'male',
      healthId: 'MB-2026-487139',
      dateOfBirth: new Date('1972-04-15'),
      accessPin: '1234',
      assignedDoctorId: demoDoctor._id,
      address: {
        street: '12, MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034'
      }
    });

    // 5. Create Demo Patient 2: Priya Patel
    const demoPatient2 = await User.create({
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya@demo.com',
      password: 'password123',
      phone: '9876543212',
      role: 'patient',
      gender: 'female',
      dateOfBirth: new Date('1988-08-22'),
      accessPin: '4321',
      address: {
        street: '45 Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      }
    });

    // 6. Create Emergency Profile for Rahul Sharma
    await EmergencyProfile.create({
      userId: demoPatient._id,
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Sulfa drugs'],
      chronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      currentMedications: [
        { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily after meals' },
        { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily morning' }
      ],
      emergencyContacts: [
        { name: 'Sunita Sharma', relationship: 'Spouse', phone: '9876543299' }
      ],
      organDonor: true,
      notes: 'History of drug-induced cutaneous rash with penicillin.'
    });

    // 7. Create Sample Medical Records
    await MedicalRecord.create([
      {
        userId: demoPatient._id,
        uploadedBy: {
          type: 'doctor',
          doctorId: demoDoctor._id,
          doctorName: 'Dr. Aarav Sharma'
        },
        title: 'Comprehensive Metabolic Panel & Lipid Profile',
        category: 'lab_report',
        description: 'Routine quarterly diabetes and lipid monitoring.',
        clinicalNotes: 'HbA1c: 7.1% (improved from 8.2%). Total Cholesterol: 185 mg/dL, LDL: 110 mg/dL, Triglycerides: 155 mg/dL. Renal profile within normal limits.',
        diagnosis: ['Type 2 Diabetes Mellitus', 'Dyslipidemia'],
        vitals: { bloodPressure: '128/82', heartRate: 72, temperature: 98.4, weight: 78, oxygenLevel: 98 },
        sensitivity: 'standard',
        department: 'general_medicine',
        isMaskedByPatient: false,
        recordDate: new Date('2026-09-15')
      },
      {
        userId: demoPatient._id,
        uploadedBy: {
          type: 'doctor',
          doctorId: demoDoctor._id,
          doctorName: 'Dr. Aarav Sharma'
        },
        title: 'Echocardiogram & Cardiac Assessment',
        category: 'imaging',
        description: 'Transthoracic echocardiogram for hypertension follow-up.',
        clinicalNotes: 'Left ventricular ejection fraction 60%. Mild concentric left ventricular hypertrophy. No regional wall motion abnormalities.',
        diagnosis: ['Essential Hypertension'],
        vitals: { bloodPressure: '134/86', heartRate: 70, temperature: 98.6, weight: 78, oxygenLevel: 99 },
        sensitivity: 'standard',
        department: 'cardiology',
        isMaskedByPatient: false,
        recordDate: new Date('2026-08-10')
      },
      {
        userId: demoPatient._id,
        uploadedBy: {
          type: 'doctor',
          doctorName: 'Dr. M. Iyer'
        },
        title: 'Psychiatric Wellness Consultation & Mild Anxiety Evaluation',
        category: 'diagnosis',
        description: 'Assessment for work-related sleep disturbances and mild anxiety.',
        clinicalNotes: 'Patient reports mild insomnia and work stress over last 3 months. Prescribed short-term Hydroxyzine 10mg PRN for nocturnal insomnia.',
        diagnosis: ['Mild Generalized Anxiety', 'Adjustment Sleep Disorder'],
        sensitivity: 'strictly_confidential',
        department: 'psychiatry',
        isMaskedByPatient: true,
        recordDate: new Date('2026-07-02')
      },
      {
        userId: demoPatient._id,
        uploadedBy: {
          type: 'self'
        },
        title: 'Previous Hospital Discharge Summary - Bronchitis',
        category: 'discharge_summary',
        description: 'Admission for acute bronchitis in late 2025.',
        clinicalNotes: 'Treated with Azithromycin 500mg. Discharged in stable condition. Penicillin allergy confirmed and documented.',
        diagnosis: ['Acute Bronchitis'],
        sensitivity: 'standard',
        department: 'general_medicine',
        isMaskedByPatient: false,
        recordDate: new Date('2025-11-20')
      }
    ]);

    // 8. Create Active Prescription
    await Prescription.create({
      patientId: demoPatient._id,
      doctorId: demoDoctor._id,
      doctorName: 'Dr. Aarav Sharma',
      hospitalName: 'Apollo Multispecialty Hospital',
      diagnosis: 'Hypertension, Type 2 Diabetes',
      medicines: [
        { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', duration: '90 days', instructions: 'After meals' },
        { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', duration: '90 days', instructions: 'In the morning' }
      ],
      advice: 'Maintain low salt diet, 30 minutes brisk walking daily. Re-check HbA1c in 3 months.',
      validUntil: new Date(Date.now() + 90 * 24 * 3600 * 1000)
    });

    // 9. Pre-grant Active Access Session for Dr. Aarav Sharma & Rahul Sharma (Instant Demo Access)
    await AccessSession.create({
      patientId: demoPatient._id,
      doctorId: demoDoctor._id,
      status: 'active',
      scopeType: 'all',
      excludeSensitive: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days active
      permissions: {
        viewRecords: true,
        viewPrescriptions: true,
        viewEmergency: true,
        addRecords: true,
        addPrescription: true
      }
    });

    console.log('✅ Demo seeding complete:');
    console.log('   - Doctor Login: doctor@demo.com / password123 (Apollo Hospital)');
    console.log(`   - Patient Login: patient@demo.com / password123 (HealthId: ${demoPatient.healthId}, PIN: 1234)`);
    console.log('   - Patient 2:     priya@demo.com / password123 (PIN: 4321)');
    console.log('   - 4 Medical Records (with Standard, Confidential, & Masked privacy levels)');
    console.log('   - 1 Emergency Profile, 1 Active Prescription, 1 Hospital with 2 Doctors');

  } catch (err) {
    console.error('Failed to seed demo data:', err.message);
  }
}

module.exports = autoSeedDatabase;
