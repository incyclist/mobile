module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./__tests__/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/jest.setup.ts'],
  moduleNameMapper: {
    '^react-native-linear-gradient$': '<rootDir>/__mocks__/react-native-linear-gradient.tsx',
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.tsx',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.tsx',
    'react-native-safe-area-context': '<rootDir>/__mocks__/react-native-safe-area-context.ts',
    '@react-navigation/native': '<rootDir>/src/__mocks__/@react-navigation/native.ts', // Added for ESM module support
  },
};