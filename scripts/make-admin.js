// Script to make a specific user an admin
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Define User schema to ensure model consistency
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: 'user' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Create User model with the name 'User'
// Using 'User' instead of 'ATSUser' to match what's used in the application
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Function to find a user by email and make them admin
const makeUserAdmin = async (email) => {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // First, check if the user exists in the database
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`No user found with email: ${email}. Creating new user...`);
      
      // Create a new user with admin role
      const newUser = new User({
        uid: 'manual-admin-' + Date.now(), // Temporary UID until Firebase auth linked
        email,
        name: email.split('@')[0],
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await newUser.save();
      console.log(`New admin user created with email: ${email}`);
      return;
    }
    
    console.log(`Found user: ${user.email} (${user.uid}), current role: ${user.role}`);
    
    // Update to admin role
    await User.updateOne(
      { _id: user._id },
      { $set: { role: 'admin', updated_at: new Date() } }
    );
    
    // Verify the update was successful
    const updatedUser = await User.findOne({ email });
    console.log(`User ${email} role updated to: ${updatedUser.role}`);
  } catch (error) {
    console.error(`Error making user admin:`, error);
  }
};

// Function to list all users
const listAllUsers = async () => {
  try {
    const users = await User.find({});
    console.log('\nAll users in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.uid}), role: ${user.role}`);
    });
  } catch (error) {
    console.error('Error listing users:', error);
  }
};

// Main function
const main = async () => {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    process.exit(1);
  }

  // Email of the user to make admin (REPLACE WITH YOUR EMAIL)
  const targetEmail = 'praneethdevarasetty31@gmail.com';
  
  // Make the user an admin
  await makeUserAdmin(targetEmail);
  
  // List all users to verify
  await listAllUsers();

  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
};

// Run the script
main(); 