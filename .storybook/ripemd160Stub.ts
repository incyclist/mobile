/**
 * Storybook stub for ripemd160.
 * 
 * ripemd160 is a Node.js crypto primitive pulled in transitively by
 * create-hash -> incyclist-services. It vendors its own copy of readable-stream
 * which crashes in the browser because it calls Buffer.prototype.slice at
 * module evaluation time (before any polyfill can patch it).
 * 
 * In Storybook we use the ICryptoBinding mock instead of native crypto,
 * so ripemd160 is never actually called. This stub satisfies the import
 * and lets the module graph resolve without crashing.
 */

export class Ripemd160Stub {
    update(_data: any) { return this; }
    digest(_encoding?: string) { return ''; }
}

export default Ripemd160Stub;
//module.exports = Ripemd160Stub;
