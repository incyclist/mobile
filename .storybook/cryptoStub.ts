export function createHash() {
  return {
    update() {
      return this;
    },
    digest() {
      return 'storybook-hash';
    },
  };
}

export default {
  createHash,
};