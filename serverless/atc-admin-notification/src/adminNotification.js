const { getDevDBConnection } = require('./devDB');
const { sns, sendEmail, buildTargetUserQuery } = require('./helper');

const sendAdminNotification = async (adminNotificationID) => {
    let client;
    try {
        if (!adminNotificationID) {
            throw new Error('Missing adminNotificationID in request');
        }

        const pool = await getDevDBConnection();
        client = await pool.connect();

        await client.query('BEGIN');

        // Retrieve AdminNotification details
        const adminNotificationQuery = `
            SELECT id, title, description, channels, target_users
            FROM "AdminNotification"
            WHERE id = $1
        `;
        const adminNotificationRes = await client.query(
            adminNotificationQuery,
            [adminNotificationID],
        );

        if (adminNotificationRes.rows.length === 0) {
            throw new Error('AdminNotification not found');
        }

        const { title, description, channels, target_users } =
            adminNotificationRes.rows[0];

        const { whereClause, values } = buildTargetUserQuery(target_users);

        // Fetch target users
        const usersQuery = `
            SELECT id, email, phone_number, device_endpoint_arn, age, gender
            FROM "User"
            ${whereClause}
        `;

        const usersRes = await client.query(usersQuery, values);

        if (usersRes.rows.length === 0) {
            throw new Error('No users found');
        }

        // Create SNS Topic
        const topicName = `AdminNotification_${adminNotificationID}`;

        const topic = await sns.createTopic({ Name: topicName }).promise();
        const topicArn = topic.TopicArn;

        const notificationsToInsert = [];
        const emailPromises = [];

        for (const user of usersRes.rows) {
            for (const channel of channels) {
                switch (channel) {
                    case 'EMAIL':
                        if (user.email) {
                            emailPromises.push(
                                sendEmail(user.email, {
                                    subject: title,
                                    text: description,
                                    html: description,
                                }),
                            );
                            notificationsToInsert.push({
                                user_id: user.id,
                                title,
                                description,
                                type: 'ADMIN_NOTIFICATION',
                                channel: channel,
                                is_sent: true,
                                admin_notification_id: adminNotificationID,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                        }
                        break;

                    case 'SMS':
                        if (user.phone_number) {
                            await sns
                                .subscribe({
                                    Protocol: 'sms',
                                    TopicArn: topicArn,
                                    Endpoint: user.phone_number,
                                })
                                .promise();
                            notificationsToInsert.push({
                                user_id: user.id,
                                title,
                                description,
                                type: 'ADMIN_NOTIFICATION',
                                channel: channel,
                                is_sent: true,
                                admin_notification_id: adminNotificationID,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                        }
                        break;

                    case 'PUSH_NOTIFICATION':
                        if (user.device_endpoint_arn) {
                            await sns
                                .subscribe({
                                    Protocol: 'application',
                                    TopicArn: topicArn,
                                    Endpoint: user.device_endpoint_arn,
                                })
                                .promise();
                            notificationsToInsert.push({
                                user_id: user.id,
                                title,
                                description,
                                type: 'ADMIN_NOTIFICATION',
                                channel: channel,
                                is_sent: true,
                                admin_notification_id: adminNotificationID,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                        }
                        break;
                }
            }
        }

        // Insert notifications into Notification table
        const insertNotificationQuery = `
            INSERT INTO "Notification" 
            ("user_id", "title", "description", "type", "channel", "is_sent", "admin_notification_id", "createdAt", "updatedAt")
            VALUES ${notificationsToInsert
                .map((_, i) => {
                    const offset = i * 9;
                    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
                })
                .join(', ')}
            `;

        const insertValues = [];
        notificationsToInsert.forEach((n) => {
            insertValues.push(
                n.user_id,
                n.title,
                n.description,
                n.type,
                n.channel,
                n.is_sent,
                n.admin_notification_id,
                n.createdAt,
                n.updatedAt,
            );
        });

        await client.query(insertNotificationQuery, insertValues);

        const message = {
            default: description,
            SMS: description,
            GCM: JSON.stringify({
                notification: {
                    title,
                    body: description,
                },
                data: {
                    type: 'ADMIN_NOTIFICATION',
                },
            }),
            APNS: JSON.stringify({
                aps: {
                    alert: {
                        title,
                        body: description,
                    },
                },
                type: 'ADMIN_NOTIFICATION',
            }),
        };

        // Publish notification to SNS Topic
        await sns
            .publish({
                TopicArn: topicArn,
                Message: JSON.stringify(message),
                MessageStructure: 'json',
            })
            .promise();

        await Promise.all(emailPromises);

        // Delete SNS Topic
        await sns.deleteTopic({ TopicArn: topicArn }).promise();

        // Update AdminNotification status
        const updateAdminNotificationQuery = `
                UPDATE "AdminNotification"
                SET status = $1
                WHERE id = $2
                `;
        await client.query(updateAdminNotificationQuery, [
            'SENT',
            adminNotificationID,
        ]);

        await client.query('COMMIT');

        return { message: 'AdminNotification sent successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sending AdminNotification:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    sendAdminNotification,
};
