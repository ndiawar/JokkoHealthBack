// src/controllers/auth/loginController.js
import User from '../../models/user/userModel.js';
import { generateToken } from '../../services/auth/tokenService.js';
import { validateLogin } from '../../middlewares/validation/authValidation.js';

export const loginUser = async (req, res) => {
    try {
        const { error } = validateLogin(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).send('User not found.');

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).send('Invalid credentials.');

        const token = generateToken(user._id);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (err) {
        res.status(500).send('Internal server error');
    }
};
