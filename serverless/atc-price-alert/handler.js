const { sendPriceAlert } = require('./src/priceAlert');

exports.handler = async (event, context) => {
    try {
        const { productIDs } =
            typeof event === 'string' ? JSON.parse(event) : event;

        if (productIDs.length === 0) {
            throw new Error('productIDs is required');
        }

        const result = await sendPriceAlert(productIDs);

        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error sending PriceAlert:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || 'Internal Server Error',
            }),
        };
    }
};
