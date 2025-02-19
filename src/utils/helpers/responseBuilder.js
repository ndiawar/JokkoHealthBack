const responseBuilder = {
    success: (data, message = 'Operation successful') => {
        return {
            status: 'success',
            message,
            data,
        };
    },

    error: (message = 'An error occurred', code = 500) => {
        return {
            status: 'error',
            message,
            code,
        };
    },

    notFound: (message = 'Resource not found') => {
        return {
            status: 'error',
            message,
            code: 404,
        };
    },

    validationError: (errors) => {
        return {
            status: 'error',
            message: 'Validation failed',
            errors,
            code: 400,
        };
    },
};

export default responseBuilder;