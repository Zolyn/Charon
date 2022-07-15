import { rename, rmdir } from 'node:fs/promises';
import { copy } from 'fs-extra';
import debugFn from 'debug';
import { ResolvedCharonOptions } from './types';
import { checkIfEmptyDir } from './utils';

const debug = debugFn('Charon:download');

export async function downloadRepo(options: ResolvedCharonOptions) {
    const {
        // @ts-expect-error
        default: { default: gitly },
    } = await import('gitly');
    const { template, dest, mode } = options;
    debug('Options %O', options);

    const isEmptyDir = await checkIfEmptyDir(dest);

    debug('isEmptyDir %o', isEmptyDir);

    if (!isEmptyDir) {
        if (mode === 'overwrite') {
            debug('Overwrite');

            return gitly(template, dest, {});
        } else if (mode === 'preserve') {
            debug('Preserve');

            const oldDir = `${dest}.charon-old`;
            await rename(dest, oldDir);
            await gitly(template, dest, {});
            await copy(oldDir, dest);
            return rmdir(oldDir);
        } else {
            throw new Error(`The directory ${dest} is not empty. See 'charon -h' for more details.`);
        }
    }

    debug('Normal');
    return gitly(template, dest, {});
}
