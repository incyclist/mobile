import type { ICryptoBinding,IHash,IHmac,ICipher,IDecipher, KeyType, KeyPair,GenerateKeyPairOptions } from 'incyclist-services';
import crypto    from 'react-native-quick-crypto';

export class CryptoBinding implements ICryptoBinding {
    randomBytes(size: number): Buffer<ArrayBufferLike> {
        return crypto.randomBytes(size) as unknown as Buffer<ArrayBufferLike>;
    }

    createHash(algorithm: string): IHash {
        return crypto.createHash(algorithm) as unknown as IHash;
    }

    createHmac(algorithm: string, key: string | Buffer): IHmac {
        return crypto.createHmac(algorithm, key) as unknown as IHmac;
    }

    createCipheriv(algorithm: string, key: Buffer, iv: Buffer): ICipher {
        return crypto.createCipheriv(algorithm, key, iv) as unknown as ICipher;
    }

    createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): IDecipher {
        return crypto.createDecipheriv(algorithm, key, iv) as unknown as IDecipher;
    }

    generateKeyPairSync(type: KeyType, options: GenerateKeyPairOptions): KeyPair {
        const result = crypto.generateKeyPairSync(type as any, options as any);
        return {
            publicKey: result.publicKey as string | Buffer,
            privateKey: result.privateKey as string | Buffer
        };
    }

   
}

export const getCryptoBinding = () => new CryptoBinding();