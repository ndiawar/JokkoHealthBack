import ProfileModel from '../../models/user/profileModel.js';
import UserModel from '../../models/user/userModel.js';

// Exports des fonctions directement
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await ProfileModel.findOne({ user: userId });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        return res.status(200).json(profile);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedProfile = await ProfileModel.findOneAndUpdate(
            { user: userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        return res.status(200).json(updatedProfile);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
