const { getDevDBConnection } = require('./devDB');

const publishWidget = async (widgetID) => {
    let client;
    try {
        if (!widgetID) {
            throw new Error('Invalid or missing widgetID in request');
        }

        const pool = await getDevDBConnection();
        client = await pool.connect();

        await client.query('BEGIN');

        // Retrieve widget and components details
        const widgetQuery = `
            SELECT
                w.id AS widget_id,
                w.widget_name,
                w.status,
                w.deploy_date,
                wc.id AS component_id,
                wc.component_type,
                wc.order,
                wc.reference_model_id,
                wc.reference_model
            FROM "Widget" w
            LEFT JOIN "WidgetComponent" wc ON w.id = wc.widget_id
            WHERE w.id = $1
        `;

        const widgetRes = await client.query(widgetQuery, [widgetID]);

        if (widgetRes.rows.length === 0) {
            throw new Error('No widget found for the given widget ID');
        }

        // Extract widget and components details
        const widget = {
            id: widgetRes.rows[0].widget_id,
            widget_name: widgetRes.rows[0].widget_name,
            status: widgetRes.rows[0].status,
            deploy_date: widgetRes.rows[0].deploy_date,
            components: widgetRes.rows
                .filter((row) => row.component_id)
                .map((row) => ({
                    id: row.component_id,
                    type: row.component_type,
                    order: row.order,
                    reference_model_id: row.reference_model_id,
                    reference_model: row.reference_model,
                })),
        };

        if (widget.components.length === 0) {
            throw new Error('Widget has no components');
        }

        // Check if widget is already published
        if (widget.status === 'ACTIVE') {
            throw new Error('Widget is already published');
        }

        // Deactivate any active widget
        const activeWidgetQuery = `
            SELECT 
                w.id AS widget_id,
                w.widget_name,
                w.status AS widget_status,
                wc.id AS component_id,
                wc.reference_model_id,
                wc.reference_model
            FROM "Widget" w
            LEFT JOIN "WidgetComponent" wc ON w.id = wc.widget_id
            WHERE w.status = 'ACTIVE'
        `;
        const activeWidgetRes = await client.query(activeWidgetQuery);

        if (activeWidgetRes.rows.length > 0) {
            const activeWidget = {
                id: activeWidgetRes.rows[0].widget_id,
                components: activeWidgetRes.rows
                    .filter((row) => row.component_id)
                    .map((row) => ({
                        id: row.component_id,
                        reference_model_id: row.reference_model_id,
                        reference_model: row.reference_model,
                    })),
            };

            // Update active widget status to PUBLISH
            await client.query(
                `UPDATE "Widget" SET status = 'PUBLISH' WHERE id = $1`,
                [activeWidget.id],
            );

            // Deactivate associated surveys
            const surveyIDs = activeWidget.components
                .filter((component) => component.reference_model === 'SURVEY')
                .map((component) => component.reference_model_id);

            if (surveyIDs.length > 0) {
                await client.query(
                    `UPDATE "Survey" SET is_active = false WHERE id = ANY($1)`,
                    [surveyIDs],
                );
            }
        }

        // Update widget status to ACTIVE
        await client.query(
            `UPDATE "Widget" SET status = 'ACTIVE' WHERE id = $1`,
            [widgetID],
        );

        // Activate associated surveys
        const newSurveyIDs = widget.components
            .filter((component) => component.reference_model === 'SURVEY')
            .map((component) => component.reference_model_id);

        if (newSurveyIDs.length > 0) {
            await client.query(
                `UPDATE "Survey" SET is_active = true WHERE id = ANY($1)`,
                [newSurveyIDs],
            );
        }

        await client.query('COMMIT');

        return {
            message: 'Widget published successfully',
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error publishing widget:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    publishWidget,
};
