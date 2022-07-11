import { defu } from 'defu';
import { CharonOptions, ResolvedCharonOptions } from './types';
import { basename } from 'node:path';

export function resolveOptions(options: CharonOptions): ResolvedCharonOptions {
    const defaultOptions = {
        preserve: false,
        overwrite: false,
    };

    options.dest ||= basename(options.template);

    return defu(options, defaultOptions) as ResolvedCharonOptions;
}
