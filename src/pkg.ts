import { readPackage } from 'read-pkg';
import { defu } from 'defu';
import { writePackage } from 'write-pkg';
import sortPackageJson from 'sort-package-json';
import debugFn from 'debug';
import { join } from 'node:path';
import { ResolvedCharonOptions } from './types';
import { JsonObject, PackageJson } from 'type-fest';
import { parseGitUser } from './git';

const debug = debugFn('Charon:pkg');

export async function replacePkgContent(options: ResolvedCharonOptions) {
    const { dest, name, author } = options;

    debug('Options %O', options);

    const source = await readPackage({ cwd: dest, normalize: false });

    debug('Source Pkg %O', source);

    const newPkgInfo: PackageJson = {
        name: name || undefined,
        author: author || undefined,
    };

    if (options.user) {
        const gitUserInfo = parseGitUser(options.user);
        const repoUrl = `https://${gitUserInfo.host}/${gitUserInfo.user}/${options.name || source.name}`;
        newPkgInfo.homepage = `${repoUrl}#readme`;
        newPkgInfo.bugs = { url: `${repoUrl}/issues` };
        newPkgInfo.repository = {
            type: 'git',
            url: `git+${repoUrl}.git`,
        };
    }

    const mergedPkg = sortPackageJson(defu(newPkgInfo, source));

    debug('Merged Pkg %O', mergedPkg);

    await writePackage(join(dest, 'package.json'), mergedPkg as JsonObject);
}
