import xss from 'xss-clean';

const xssMiddleware = (req, res, next) => {
    xss(req.body);
    xss(req.query);
    xss(req.params);
    next();
};

export default xssMiddleware;
