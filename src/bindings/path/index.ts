import { IPathBinding } from 'incyclist-services';
import path from 'path-browserify';

export class PathBinding implements IPathBinding {
    join(...paths: string[]): string {
        return path.join(...paths);
    }

    parse(pathString: string): any {
        return path.parse(pathString);
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