const roleCheck = (roles) => {
    return (req, res, next) => {
        const userRole = req.user.role; // Assuming user role is attached to the request

        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
};

export default roleCheck;
