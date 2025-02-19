const responseFormatter = (req, res, next) => {
    res.success = (data, message = 'Success') => {
        res.status(200).json({
            status: 'success',
            message,
            data,
        });
    };

    res.error = (message = 'Error', statusCode = 400) => {
        res.status(statusCode).json({
            status: 'error',
            message,
        });
    };

    next();
};

export default responseFormatter;
