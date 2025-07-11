const healthCheck = (req, res) => {
    return res.status(200).json({
        message: 'Healthy',
    });
};

module.exports = {
    healthCheck,
};
