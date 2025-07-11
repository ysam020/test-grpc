const { publishWidget } = require('./src/publishWidget');

module.exports.handler = async (event, context) => {
    try {
        const { widgetID } =
            typeof event === 'string' ? JSON.parse(event) : event;

        if (!widgetID) {
            throw new Error('widgetID is required');
        }

        const result = await publishWidget(widgetID);

        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error publishing widget:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || 'Internal Server Error',
            }),
        };
    }
};
