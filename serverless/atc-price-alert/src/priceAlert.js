const { getDevDBConnection } = require('./devDB');
const { sns } = require('./helper');

const sendPriceAlert = async (productIDs) => {
    let client;
    try {
        if (!Array.isArray(productIDs) || productIDs.length === 0) {
            throw new Error('Missing productIDs in request');
        }

        const pool = await getDevDBConnection();
        client = await pool.connect();

        await client.query('BEGIN');

        // Retrieve all price alerts for the given product IDs
        const priceAlertQuery = `
            SELECT pa.id, pa.user_id, pa.product_id, pa.target_price 
            FROM "PriceAlert" pa 
            WHERE pa.product_id = ANY($1)
        `;
        const priceAlertsRes = await client.query(priceAlertQuery, [
            productIDs,
        ]);

        if (priceAlertsRes.rows.length === 0) {
            throw new Error('No price alerts found for the given product IDs');
        }

        // Retrieve user device endpoint ARNs
        const userIds = priceAlertsRes.rows.map((alert) => alert.user_id);
        const userQuery = `
            SELECT u.id, u.device_endpoint_arn  
            FROM "User" u 
            WHERE u.id = ANY($1)
        `;
        const usersRes = await client.query(userQuery, [userIds]);

        // Map user IDs to device ARN
        const userDeviceMap = usersRes.rows.reduce((map, user) => {
            if (user.device_endpoint_arn) {
                map[user.id] = user.device_endpoint_arn;
            }
            return map;
        }, {});

        // Retrieve product details (name, current_price)
        const productQuery = `
            SELECT p.id, p.product_name, rcp.current_price 
            FROM "MasterProduct" p
            JOIN "RetailerCurrentPricing" rcp 
            ON p.id = rcp.product_id
            WHERE p.id = ANY($1)
            `;
        const productsRes = await client.query(productQuery, [productIDs]);

        // Prepare notifications to be inserted
        const notificationsToInsert = [];
        const notificationsToSend = [];
        const title = 'Price Alert';
        priceAlertsRes.rows.forEach((alert) => {
            const product = productsRes.rows.find(
                (p) => p.id === alert.product_id,
            );
            const userDeviceArn = userDeviceMap[alert.user_id];

            if (
                product &&
                userDeviceArn &&
                product.current_price <= alert.target_price
            ) {
                const message = `Price Alert! The price of "${product.product_name}" has dropped to ${product.current_price}, which is below your target price of ${alert.target_price}.`;

                notificationsToInsert.push({
                    user_id: alert.user_id,
                    title,
                    description: message,
                    type: 'PRICE_ALERT',
                    price_alert_id: alert.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                const params = {
                    Message: JSON.stringify({
                        default: message,
                        GCM: JSON.stringify({
                            notification: {
                                title,
                                body: message,
                            },
                            data: {
                                type: 'PRICE_ALERT',
                                id: product.id,
                            },
                        }),
                        APNS: JSON.stringify({
                            aps: {
                                alert: {
                                    title,
                                    body: message,
                                },
                            },
                            type: 'PRICE_ALERT',
                            id: product.id,
                        }),
                    }),
                    TargetArn: userDeviceArn,
                    MessageStructure: 'json',
                };

                notificationsToSend.push({
                    params,
                    price_alert_id: alert.id,
                });
            }
        });

        if (notificationsToInsert.length === 0) {
            return {
                message: 'No price alerts to trigger for the given products',
            };
        }

        const insertNotificationQuery = `
                INSERT INTO "Notification" ("user_id", "title", "description", "type", "price_alert_id", "createdAt", "updatedAt")
                VALUES ${notificationsToInsert
                    .map((_, i) => {
                        const offset = i * 7;
                        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
                    })
                    .join(', ')}
                RETURNING id, price_alert_id
                `;

        const insertValues = notificationsToInsert.flatMap((notification) => [
            notification.user_id,
            notification.title,
            notification.description,
            notification.type,
            notification.price_alert_id,
            notification.createdAt,
            notification.updatedAt,
        ]);

        await client.query(insertNotificationQuery, insertValues);

        // Send all notifications in parallel
        const results = await Promise.all(
            notificationsToSend.map(async (notification) => {
                try {
                    await sns.publish(notification.params).promise();
                    return notification.price_alert_id;
                } catch (error) {
                    console.error('Error sending notification:', error);
                    return null;
                }
            }),
        );

        // Filter out null values (failed notifications)
        const successfulNotificationIds = results.filter((id) => id !== null);

        if (successfulNotificationIds.length > 0) {
            // Update is_sent status for the successfully sent notifications
            const updateIsSentQuery = `
                  UPDATE "Notification"
                  SET is_sent = true
                  WHERE price_alert_id = ANY($1)
              `;
            await client.query(updateIsSentQuery, [successfulNotificationIds]);
        }

        await client.query('COMMIT');

        return { message: 'Push notifications sent successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sending push notifications:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    sendPriceAlert,
};
