// src/controllers/auth/registerController.js
import { validateLogin } from '../../middlewares/validation/authValidation.js'; // Utiliser validateLogin
import User from '../../models/user/userModel.js';
import emailService from '../../services/email/emailService.js';

export const registerUser = async (req, res) => {
    const { error } = validateLogin(req.body); // Utiliser la validation de connexion ici
    if (error) return res.status(400).send(error.details[0].message);

    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).send('User already registered.');

        user = new User({ username, email, password });
        await user.save();

        // Utiliser la fonction sendWelcomeEmail
        await emailService.sendWelcomeEmail(user.email);

        res.status(201).send('User registered successfully.');
    } catch (err) {
        res.status(500).send('Internal server error.');
    }
};

