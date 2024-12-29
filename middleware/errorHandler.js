const errorHandler = (err, req, res, next) => {
    const statuscode = err.statuscode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statuscode).json({
        success: false,
        message: message,
        // Optionally include stack trace in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

export default  errorHandler;