export default {
    captureRef: () => Promise.resolve(''),
    captureScreen: () => Promise.resolve(''),
}

export const captureScreen = async () => '';

node -e 'const {a} = false; console.log(a)'