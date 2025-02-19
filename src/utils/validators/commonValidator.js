const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isPhoneNumber = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
};

const isNotEmpty = (value) => {
    return value && value.trim() !== '';
};

const isValidDate = (date) => {
    return !isNaN(Date.parse(date));
};

const isInArray = (value, array) => {
    return Array.isArray(array) && array.includes(value);
};

export { isEmail, isPhoneNumber, isNotEmpty, isValidDate, isInArray };