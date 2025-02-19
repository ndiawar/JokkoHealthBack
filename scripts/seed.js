const mongoose = require('mongoose');
const User = require('../src/models/user/userModel');
const Profile = require('../src/models/user/profileModel');
const Role = require('../src/models/user/roleModel');

async function seedDatabase() {
    await mongoose.connect(process.env.DB_CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Clear existing data
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Role.deleteMany({});

    // Create roles
    const adminRole = new Role({ name: 'admin' });
    const userRole = new Role({ name: 'user' });
    await adminRole.save();
    await userRole.save();

    // Create users
    const user1 = new User({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        role: adminRole._id,
    });

    const user2 = new User({
        username: 'jane_doe',
        email: 'jane@example.com',
        password: 'password123',
        role: userRole._id,
    });

    await user1.save();
    await user2.save();

    // Create profiles
    const profile1 = new Profile({
        user: user1._id,
        bio: 'Admin user',
    });

    const profile2 = new Profile({
        user: user2._id,
        bio: 'Regular user',
    });

    await profile1.save();
    await profile2.save();

    console.log('Database seeded successfully!');
    mongoose.connection.close();
}

seedDatabase().catch(err => {
    console.error('Error seeding database:', err);
    mongoose.connection.close();
});