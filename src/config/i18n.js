import i18n from 'i18n';
import path from 'path';

i18n.configure({
    locales: ['en', 'fr'],
    directory: path.join(__dirname, '/../locales'),
    defaultLocale: 'en',
    autoReload: true,
    syncFiles: true,
    cookie: 'lang',
});

export default i18n;