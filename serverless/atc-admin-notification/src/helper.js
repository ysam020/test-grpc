const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

require('dotenv').config();

const sns = new AWS.SNS({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});

async function sendEmail(to, emailContent) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SIB_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SIB_USER,
                pass: process.env.SIB_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SIB_SENDER_EMAIL,
            to: to,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const AGE_RANGES = {
    CHILD: [0, 17],
    YOUNG_ADULT: [18, 20],
    ADULT: [21, 30],
    MIDDLE_AGED: [31, 40],
    SENIOR_ADULT: [41, 50],
    OLDER_ADULT: [51, 60],
    SENIOR: [61, null],
};

const buildTargetUserQuery = (targetUsers) => {
    const conditions = [];
    const values = [];

    // Exclude unverified users
    conditions.push(`is_verified = true`);

    // Exclude admin users
    conditions.push(`role != 'admin'`);

    // Filter by location
    if (
        targetUsers.location &&
        targetUsers.location.includes('ALL') === false
    ) {
        conditions.push(
            `region IN (${targetUsers.location.map((_, i) => `$${values.length + i + 1}`).join(', ')})`,
        );
        values.push(...targetUsers.location);
    }

    // Filter by state
    // if (targetUsers.states && targetUsers.states.includes('ALL') === false) {
    //     conditions.push(
    //         `state IN (${targetUsers.states.map((_, i) => `$${values.length + i + 1}`).join(', ')})`,
    //     );
    //     values.push(...targetUsers.states);
    // }

    // Filter by age
    if (targetUsers.age && targetUsers.age.includes('ALL') === false) {
        const ageConditions = [];
        targetUsers.age.forEach((ageGroup) => {
            const [min, max] = AGE_RANGES[ageGroup];
            if (min !== null && max !== null) {
                ageConditions.push(
                    `(age >= $${values.length + 1} AND age <= $${values.length + 2})`,
                );
                values.push(min, max);
            } else if (min !== null) {
                ageConditions.push(`age >= $${values.length + 1}`);
                values.push(min);
            }
        });
        conditions.push(`(${ageConditions.join(' OR ')})`);
    }

    // Filter by gender
    if (targetUsers.gender && targetUsers.gender !== 'BOTH') {
        conditions.push(`gender = $${values.length + 1}`);
        values.push(targetUsers.gender);
    }

    // Filter by has_children
    if (targetUsers.has_children === 'YES') {
        conditions.push(`no_of_children > 0`);
    } else if (targetUsers.has_children === 'NO') {
        conditions.push(`no_of_children = 0`);
    }

    const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
};

module.exports = { sns, sendEmail, buildTargetUserQuery };
