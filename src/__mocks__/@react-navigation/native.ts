export const useNavigation = () => ({
    addListener: jest.fn(() => jest.fn()),
});

export const useRoute = () => ({
    key: 'test',
    name: 'test',
    params: undefined,
});