import { IPathBinding } from 'incyclist-services';
import path from 'path-browserify';

export class PathBinding implements IPathBinding {
    join(...paths: string[]): string {
        if (paths[0]?.startsWith('content://')) {
            return paths.join('%2F')
        }
        if (paths[0]?.startsWith('file://')) {
            return 'file://' + path.join(...paths.map((p, i) => i === 0 ? p.slice(7) : p))
        }
        return path.join(...paths)
    }

    parse(pathString: string): any {
        if (pathString.startsWith('content://')) {
            const parts = pathString.split('%2F')
            const encoded = parts.pop() ?? ''
            const base = decodeURIComponent(encoded)
            const dir = parts.join('%2F')
            const dotIndex = base.lastIndexOf('.')
            const ext = dotIndex >= 0 ? base.slice(dotIndex) : ''
            const name = dotIndex >= 0 ? base.slice(0, dotIndex) : base
            return { root: 'content://', dir, base, ext, name }
        }        
        if (pathString.startsWith('file://')) {
            return path.parse(pathString.slice(7))
        }
        return path.parse(pathString)
    }
}


/*  Direct Implementation
export class PathBinding implements IPathBinding {
    join(...paths: string[]): string {
        return paths
            .join('/')
            .replace(/\/+/g, '/')
            .replace(/\/$/, '');
    }

    parse(pathString: string) {
        const parts = pathString.split('/');
        const base = parts.pop() || '';
        const dir = parts.join('/');
        const extParts = base.split('.');
        const ext = extParts.length > 1 ? `.${extParts.pop()}` : '';
        const name = extParts.join('.');

        return {
            root: pathString.startsWith('/') ? '/' : '',
            dir,
            base,
            ext,
            name
        };
    }
}
*/

export const getPathBinding = () => new PathBinding();