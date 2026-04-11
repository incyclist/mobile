export default {
    isAvailable: jest.fn().mockResolvedValue(true),
    openAuth: jest.fn().mockResolvedValue({ type: 'cancel' }),
    close: jest.fn(),
};