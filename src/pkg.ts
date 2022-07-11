import { readPackage } from 'read-pkg';
import { defu } from 'defu';
import { PackageJson } from 'pkg-types';
import { writePackage } from 'write-pkg';
import { join } from 'node:path';

export async function replacePkgContent(path: string, replaceContent: PackageJson) {
    const source = await readPackage({ cwd: path });
    const mergedPkg = defu(replaceContent, source);
    await writePackage(join(path, 'package.json'), mergedPkg);
}
