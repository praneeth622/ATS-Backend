// Script to check a user's role in the database
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
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  role: { type: String, default: 'user' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Create User model with the name 'User'
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Function to check user by email or UID
const checkUser = async (identifier) => {
  try {
    console.log(`Looking for user with identifier: ${identifier}`);
    
    // Check if the identifier looks like an email
    const isEmail = identifier.includes('@');
    
    let user;
    if (isEmail) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ uid: identifier });
    }
    
    if (!user) {
      console.log(`No user found with ${isEmail ? 'email' : 'uid'}: ${identifier}`);
      return;
    }
    
    console.log('\nUser details:');
    console.log(`- Email: ${user.email}`);
    console.log(`- UID: ${user.uid}`);
    console.log(`- Name: ${user.name || 'Not set'}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Created: ${user.created_at}`);
    console.log(`- Updated: ${user.updated_at}`);
    
  } catch (error) {
    console.error(`Error checking user:`, error);
  }
};

// Function to list all users
const listAllUsers = async () => {
  try {
    const users = await User.find({}).sort({ email: 1 });
    console.log('\nAll users in database:');
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach(user => {
        console.log(`- ${user.email} (${user.uid}), role: ${user.role}`);
      });
    }
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

  // Parse command line arguments
  const args = process.argv.slice(2);
  const identifier = args[0];
  
  if (identifier) {
    // Check the specific user
    await checkUser(identifier);
  }
  
  // List all users
  await listAllUsers();

  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
};

// Run the script
main(); 