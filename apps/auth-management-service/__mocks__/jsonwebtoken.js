// apps/auth-management-service/__mocks__/jsonwebtoken.js
module.exports = {
    sign: jest.fn().mockReturnValue('mocked.jwt.token'),
    verify: jest.fn().mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    }),
    decode: jest.fn().mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    }),
};
