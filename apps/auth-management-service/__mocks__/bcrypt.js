// apps/auth-management-service/__mocks__/bcrypt.js
module.exports = {
    hash: jest.fn().mockResolvedValue('$2b$10$mockedHashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
    genSalt: jest.fn().mockResolvedValue('$2b$10$mockedSalt'),
    hashSync: jest.fn().mockReturnValue('$2b$10$mockedHashedPasswordSync'),
    compareSync: jest.fn().mockReturnValue(true),
    genSaltSync: jest.fn().mockReturnValue('$2b$10$mockedSaltSync'),
};
