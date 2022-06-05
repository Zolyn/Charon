import { defu } from 'defu';
import { basename } from 'node:path';
import { CharonOptions, DefaultCharonOptions, ResolvedCharonOptions } from './types';

export function resolveOptions(options: CharonOptions): ResolvedCharonOptions {
    const defaultOptions: DefaultCharonOptions = {
        dest: basename(options.template),
        mode: 'normal',
    };

    return defu(options, defaultOptions) as ResolvedCharonOptions;
}
