import { execa } from 'execa';
import { join } from 'node:path';
import debugFn from 'debug';
import { checkIfEmptyDir } from './utils';

const debug = debugFn('Charon:git');

export async function initGitRepo(path: string): Promise<boolean> {
    const isEmptyDir = await checkIfEmptyDir(join(path, '.git'));

    if (!isEmptyDir) {
        debug('Already had a git repository, skipping');
        return false;
    }

    await execa('git', ['init', path]);

    return true;
}
