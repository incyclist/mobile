module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        '@babel/plugin-transform-export-namespace-from',
        '@babel/plugin-transform-class-static-block', 
        [
            'module-resolver', {
                alias: {
                    // This regex strips the 'node:' prefix from any import
                    '^node:(.+)': '\\1',
                },
            },
        ],        
        // 'react-native-reanimated/plugin', // Keep this last if you have it
    ],
};
