import type {
  ICryptoBinding,
  IHash,
  IHmac,
  ICipher,
  IDecipher,
  KeyPair,
} from 'incyclist-services';

function createHashMock(): IHash {
  let data = '';

  return {
    update(chunk: any) {
      data += chunk?.toString?.() ?? '';
      return this;
    },
    digest(encoding?: 'hex' | 'base64') {
      const fake = 'storybook-hash';
      if (!encoding) {
        return new Uint8Array([1, 2, 3]) as any;
      }
      return fake;
    },
  };
}

export const mockCryptoBinding: ICryptoBinding = {
  randomBytes(size: number) {
    return new Uint8Array(size) as any;
  },

  createHash() {
    return createHashMock();
  },

  createHmac() {
    return createHashMock() as IHmac;
  },

  createCipheriv() {
    return {
      update() { return this; },
      final() { return new Uint8Array(); },
      setAutoPadding() { return this; },
    } as ICipher;
  },

  createDecipheriv() {
    return {
      update() { return new Uint8Array(); },
      final() { return new Uint8Array(); },
      setAutoPadding() { return this; },
    } as IDecipher;
  },

  generateKeyPairSync(): KeyPair {
    return {
      publicKey: 'storybook-public-key',
      privateKey: 'storybook-private-key',
    };
  },
};
