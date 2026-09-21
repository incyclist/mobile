// MmkvJsonRepositoryBinding: covers list() returning names that JsonRepository (incyclist-services)
// can actually resolve back to a resource id. JsonRepository.list() is shared with the file-system
// based desktop/web-ui binding, where every resource is a "<id>.json" file - it filters returned
// names for that suffix and strips it. MMKV keys carry no such suffix on their own, so a repo that
// enumerates resources by list() (rather than reading a single already-known id) previously saw an
// empty result on every call, even though write()/read() on a known id worked.

jest.mock('react-native-mmkv', () => {
    const stores = new Map<string, Map<string, string>>();

    return {
        createMMKV: ({ id }: { id: string }) => {
            if (!stores.has(id))
                stores.set(id, new Map());
            const store = stores.get(id)!;

            return {
                getString: (key: string) => store.get(key),
                set: (key: string, value: string) => { store.set(key, value); },
                remove: (key: string) => {
                    const had = store.has(key);
                    store.delete(key);
                    return had;
                },
                getAllKeys: () => Array.from(store.keys()),
            };
        },
    };
});

jest.mock('../../utils/timers', () => ({ sleep: jest.fn().mockResolvedValue(undefined) }));

import { getMmkvRepositoryBinding } from './mmkv';

describe('MmkvJsonRepositoryBinding', () => {

    test('list() returns names JsonRepository can resolve back to the id write() was given', async () => {
        const binding = getMmkvRepositoryBinding();
        const access = await binding.create('folderAccessGrants');

        await access!.write('a1b2c3d4', { folder: '/some/path' });
        await access!.write('e5f6a7b8', { folder: '/other/path' });

        const names = await access!.list();

        // simulate exactly what JsonRepository.list() does with the returned names
        const resolved = names
            .filter(n => n.toLowerCase().endsWith('.json'))
            .map(n => n.substring(0, n.length - 5));

        expect(resolved.sort()).toEqual(['a1b2c3d4', 'e5f6a7b8'].sort());
    });

    test('read() still finds a value under the plain id written by write()', async () => {
        const binding = getMmkvRepositoryBinding();
        const access = await binding.create('folderAccessGrants2');

        await access!.write('grant-1', { folder: '/picked' });

        await expect(access!.read('grant-1')).resolves.toEqual({ folder: '/picked' });
    });

    test('list() excludes the internal __index__ key', async () => {
        const binding = getMmkvRepositoryBinding();
        const access = await binding.create('folderAccessGrants3');

        await access!.write('grant-1', { folder: '/picked' });
        // an internal key some MMKV usages carry alongside real entries
        (access as any).storage?.set?.('__index__', '[]');

        const names = await access!.list();
        expect(names).not.toContain('__index__');
        expect(names).not.toContain('__index__.json');
    });

    test('delete() removes the value written by write(), by the same plain id', async () => {
        const binding = getMmkvRepositoryBinding();
        const access = await binding.create('folderAccessGrants4');

        await access!.write('grant-1', { folder: '/picked' });
        await access!.delete('grant-1');

        await expect(access!.read('grant-1')).resolves.toEqual({});
        const names = await access!.list();
        expect(names).toEqual([]);
    });
});
