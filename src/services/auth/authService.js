import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/user/userModel';
import { JWT_SECRET, JWT_EXPIRATION } from '../../config/environment';

class AuthService {
    async register(userData) {
        const { email, password } = userData;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ ...userData, password: hashedPassword });
        await newUser.save();

        return newUser;
    }

    async login(email, password) {
        console.log('Tentative de connexion pour:', email);
        const user = await User.findOne({ email });
        console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');
        
        if (!user) {
            console.log('Utilisateur non trouvé:', email);
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Mot de passe correspond:', isMatch ? 'Oui' : 'Non');
        
        if (!isMatch) {
            console.log('Mot de passe incorrect pour:', email);
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        console.log('Token généré avec succès pour:', email);
        return { user, token };
    }

    async changePassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });
    }
}

export default new AuthService();