const superAdminSchema = new mongoose.Schema({
    permissions: { type: [String], default: ['manage_users', 'view_reports'] }
});

const SuperAdmin = User.discriminator('SuperAdmin', superAdminSchema);
export default SuperAdmin;
