import { readPackage } from 'read-pkg';
import { defu } from 'defu';
import { writePackage } from 'write-pkg';
import sortPackageJson from 'sort-package-json';
import debugFn from 'debug';
import { join } from 'node:path';
import { ResolvedCharonOptions } from './types';

const debug = debugFn('Charon:pkg');

export async function replacePkgContent(options: ResolvedCharonOptions) {
    const { dest, name, author } = options;

    debug('Options %O', options);

    const source = await readPackage({ cwd: dest, normalize: false });

    debug('Source Pkg %O', source);

    const mergedPkg = sortPackageJson(
        defu(
            {
                name: name || null,
                author: author || null,
            },
            source,
        ),
    );

    debug('Merged Pkg %O', mergedPkg);

    await writePackage(join(dest, 'package.json'), mergedPkg);
}
