export default {
    getDeviceName:   () => Promise.resolve('Mock Device'),
    getManufacturer: () => Promise.resolve('Mock Manufacturer'),
    getModel:        () => 'Mock Model',
    getBrand:        () => 'MockBrand',
    getSystemName:   () => 'iOS',
    getSystemVersion:() => '17.0',
    isTablet:        () => false,
    getVersion:      () => '1.0.0',
    getBuildNumber:  () => '1',
};