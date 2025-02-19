// dateHelper.js

const formatDate = (date, format) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
};

const parseDate = (dateString) => {
    return new Date(dateString);
};

const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
};

export { formatDate, parseDate, isValidDate };