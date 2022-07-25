import { execa } from 'execa';
import { join } from 'node:path';
import debugFn from 'debug';
import { checkIfEmptyDir } from './utils';
import { GitUserInfo } from './types';

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

export function parseGitUser(val: string): GitUserInfo {
    const debugParse = debug.extend('parseGitUser');
    const URLProtocolRE = /^\w+:\/\//i;
    // NOTE: It works in most scenarios though it is not strict enough
    const domainRE = /^[^:]+\.\w+/i;
    const hostRE = /^\w+:/i;
    const slashRE = /\//;

    const hostMap: Record<string, string> = {
        github: 'github.com',
        gitlab: 'gitlab.com',
        bitbucket: 'bitbucket.org',
    };

    const info: GitUserInfo = {
        host: '',
        user: '',
    };

    debugParse('Raw input: %s', val);
    const user = val.replace(URLProtocolRE, '');
    debugParse('Input after removing protocol: %s', user);

    if (domainRE.test(user)) {
        debugParse('Domain');

        const userClip = user.split('/');
        info.host = userClip[0];
        info.user = userClip[1];
    } else if (hostRE.test(user)) {
        debugParse('host');

        const userClip = user.split(':');
        info.host = hostMap[userClip[0]] || 'github.com';
        info.user = userClip[1];
    } else {
        debugParse('Fallback to github');

        info.host = 'github.com';
        info.user = user;
    }

    debugParse('GitUserInfo %O', info);

    if (!info.user) {
        debugParse('Cannot find username');
        throw new Error('Cannot find username');
    }

    if (slashRE.test(info.host) || slashRE.test(info.user)) {
        debugParse('Got invalid value while parsing');
        throw new Error('Got invalid value while parsing');
    }

    return info;
}
