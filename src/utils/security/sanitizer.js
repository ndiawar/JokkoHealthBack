const sanitizer = {
    sanitizeString: (input) => {
        return input.replace(/<[^>]*>/g, ''); // Remove HTML tags
    },

    sanitizeEmail: (email) => {
        return email.trim().toLowerCase(); // Trim and convert to lowercase
    },

    sanitizeInput: (input) => {
        if (typeof input === 'string') {
            return sanitizer.sanitizeString(input);
        }
        return input; // Return as is if not a string
    }
};

export default sanitizer;