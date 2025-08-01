const AWS = require('aws-sdk');

require('dotenv').config();

const sns = new AWS.SNS({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});

module.exports = { sns };
