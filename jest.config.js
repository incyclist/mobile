module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^react-native-linear-gradient$': '<rootDir>/__mocks__/react-native-linear-gradient.tsx',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.tsx',
    'react-native-safe-area-context': '<rootDir>/__mocks__/react-native-safe-area-context.ts',
    '@react-navigation/native': '<rootDir>/src/__mocks__/@react-navigation/native.ts', // Added for ESM module support
  },
};