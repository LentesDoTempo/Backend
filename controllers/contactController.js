const { sendServiceRequestEmail } = require('../services/emailService');

const serviceRequest = async (req, res) => {
    try {
        const { name, institution, email, message } = req.body;

        await sendServiceRequestEmail({
            name,
            institution,
            email,
            message,
        });

        return res.status(201).json({
            message: 'Service request sent successfully',
        });
    } catch (error) {
        console.error('Service request error:', error);
        return res.status(500).json({
            error: 'Failed to send service request',
        });
    }
};

module.exports = {
    serviceRequest,
};
