const { sendAdminNotification } = require('./src/adminNotification');

exports.handler = async (event, context) => {
    try {
        const { adminNotificationID } =
            typeof event === 'string' ? JSON.parse(event) : event;

        if (!adminNotificationID) {
            throw new Error('adminNotificationID is required');
        }

        const result = await sendAdminNotification(adminNotificationID);

        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error sending AdminNotification:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || 'Internal Server Error',
            }),
        };
    }
};
