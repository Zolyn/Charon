import gitly from 'gitly';
import { rename } from 'node:fs/promises';
import { copy } from 'fs-extra';
import { ResolvedCharonOptions } from './types';
import { checkIfEmptyDir } from './utils';

export async function downloadRepo(options: ResolvedCharonOptions) {
    const isEmptyDir = await checkIfEmptyDir(options.dest);
    if (!isEmptyDir) {
        if (options.overwrite) {
            return gitly(options.template, options.dest, {});
        } else if (options.preserve) {
            const oldDir = `${options.dest}.charon-old`;
            await rename(options.dest, oldDir);
            await gitly(options.template, options.dest, {});
            await copy(oldDir, options.dest);
        } else {
            throw new Error(`The directory ${options.dest} is not empty.`);
        }
    }

    return gitly(options.template, options.dest, {});
}
