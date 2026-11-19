const mockStart = jest.fn();
const mockConnect = jest.fn().mockResolvedValue(true);
const mockOnRecovered = jest.fn();

jest.mock('incyclist-services', () => ({
    useFeatureToggleSync: () => ({ start: mockStart }),
}));
jest.mock('../mq', () => ({
    getMessageQueueBinding: () => ({ connect: mockConnect }),
}));
jest.mock('../user-settings', () => ({
    getUserSettingsBinding: () => ({ getValue: jest.fn().mockReturnValue('uuid-1') }),
}));
jest.mock('./index', () => ({
    getSecretBinding: () => ({ onRecovered: mockOnRecovered }),
}));

import { registerSecretsRecovery } from './recovery';

describe('registerSecretsRecovery', () => {
    beforeEach(() => jest.clearAllMocks());

    test('restarts feature-toggle sync and message queue when secrets recover', () => {
        registerSecretsRecovery();
        const handler = mockOnRecovered.mock.calls[0][0];

        handler();

        expect(mockStart).toHaveBeenCalledWith('uuid-1');
        expect(mockConnect).toHaveBeenCalled();
    });

    test('a failing connect does not throw', async () => {
        mockConnect.mockRejectedValueOnce(new Error('x'));
        registerSecretsRecovery();
        const handler = mockOnRecovered.mock.calls[0][0];

        expect(() => handler()).not.toThrow();
        await Promise.resolve();
    });
});
