import { readdir } from 'node:fs/promises';

export async function checkIfEmptyDir(path: string) {
    let dir: string[];
    let isDirExists = true;

    dir = await readdir(path).catch(e => {
        if (e.code !== 'ENOENT') {
            throw e;
        }

        isDirExists = false;
        return [];
    });

    if (!isDirExists) {
        return true;
    }

    return !dir.length;
}
