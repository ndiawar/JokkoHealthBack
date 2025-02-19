import fs from 'fs';
import path from 'path';

class TemplateService {
    constructor() {
        this.templatesDir = path.join(__dirname, '../../templates/emails');
    }

    getTemplate(templateName) {
        const templatePath = path.join(this.templatesDir, templateName);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template ${templateName} not found`);
        }
        return fs.readFileSync(templatePath, 'utf-8');
    }

    getWelcomeTemplate() {
        return this.getTemplate('welcome');
    }

    getResetPasswordTemplate() {
        return this.getTemplate('reset-password');
    }

    getVerificationTemplate() {
        return this.getTemplate('verification');
    }
}

export default new TemplateService();