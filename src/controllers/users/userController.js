import User from '../../models/user/userModel.js';
import ProfileModel from '../../models/user/profileModel.js';

class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await UserModel.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching users', error });
        }
    }

    async getUserById(req, res) {
        const { id } = req.params;
        try {
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching user', error });
        }
    }

    async createUser(req, res) {
        const newUser = new UserModel(req.body);
        try {
            const savedUser = await newUser.save();
            res.status(201).json(savedUser);
        } catch (error) {
            res.status(400).json({ message: 'Error creating user', error });
        }
    }

    async updateUser(req, res) {
        const { id } = req.params;
        try {
            const updatedUser = await UserModel.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(400).json({ message: 'Error updating user', error });
        }
    }

    async deleteUser(req, res) {
        const { id } = req.params;
        try {
            const deletedUser = await UserModel.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting user', error });
        }
    }
}

// Exporte la classe directement
export default new UserController();
