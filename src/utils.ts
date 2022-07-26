import Conf from 'conf';
import debugFn from 'debug';
import defu from 'defu';
import logSymbols from 'log-symbols';
import { readdir } from 'node:fs/promises';
import colors from 'picocolors';
import prompts, { PromptObject } from 'prompts';
import localPkg from '../package.json';
import { CreatePromptOptions, GetOrSetValueOptions, Validator } from './types';

export const configKeys = ['author', 'mode', 'skip', 'git', 'user'] as const;

export type ConfigKeys = typeof configKeys[number];

export function createUtilsDebugger(name: string) {
    return debugFn(`Charon:utils:${name}`);
}

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

export async function createPrompt<R = any, T extends string = string>(options: CreatePromptOptions<T>): Promise<R>;
export async function createPrompt<T extends string = string>(
    options: CreatePromptOptions<T>[],
): Promise<prompts.Answers<T>>;
export async function createPrompt<R = any, T extends string = string>(
    options: CreatePromptOptions<T> | CreatePromptOptions<T>[],
): Promise<prompts.Answers<T> | R> {
    if (!Array.isArray(options)) {
        /* eslint-disable-next-line */
        options = [options];
    }

    const onCancel = () => {
        console.error(logSymbols.error, colors.red('Aborting'));
        process.exit(1);
    };

    const promptObject = options.map(opts => {
        const { name, when, message, required = false, type = 'text' } = opts;

        return defu(opts.promptOptions!, {
            name,
            type: when
                ? (prev: any) => {
                      if (when(prev)) {
                          return type;
                      }

                      return null;
                  }
                : type,
            message: required ? message : `${message}${type === 'text' ? ' (Enter to skip)' : ''}`,
            validate: required ? (v: any) => !!v || 'Error: Requires value.' : undefined,
        }) as PromptObject<T>;
    });

    if (promptObject.length === 1) {
        const promptObj = promptObject[0];
        return (await prompts(promptObj, { onCancel }))[promptObj.name as T];
    }

    return prompts(promptObject, { onCancel });
}

export function getLocalPkg() {
    return localPkg;
}

export function getConf(): Conf {
    const { name, version } = getLocalPkg();

    return new Conf({ projectName: name, projectVersion: version });
}

export const BooleanValidator: Validator = val => ['true', 'false'].includes(val);

export function getOrSetValue(options: GetOrSetValueOptions) {
    const debug = createUtilsDebugger(getOrSetValue.name);

    const { conf, key, value, validator } = options;
    const isGet = typeof value === 'boolean';
    const isSet = typeof value === 'string';

    if (isGet) {
        debug('Get "%s"', key);

        const val = conf.get(key);
        if (typeof val !== 'undefined') {
            console.log(logSymbols.info, val);
            process.exit(0);
        }

        debug('Value not found on key "%s"', key);
        console.error(logSymbols.error, 'Not found');
        process.exit(1);
    } else if (isSet) {
        debug('Set "%s"', key);

        if (validator && !validator(value)) {
            debug('Invalid value when setting "%s"', key);
            console.error(logSymbols.error, 'Invalid value');
            process.exit(1);
        }

        const filteredValue = options.filter ? options.filter(value) : value;

        conf.set(key, validator === BooleanValidator ? filteredValue === 'true' : filteredValue);
        console.log(logSymbols.info, filteredValue);
        console.log(logSymbols.success, colors.green('Done.'));
        process.exit(0);
    }
}

/**
 * We temporarily use this function to validate arguments because CAC is weak at verifying types of arguments
 * Currently we can't find a way to make an option accepts only one value directly.
 * Also we don't know how to get CAC to treat numbers as strings. (This is useful in some scenarios.)
 */
export function checkInvalidTypes(obj: object, types: string[]) {
    const debug = createUtilsDebugger(checkInvalidTypes.name);

    Object.entries(obj).forEach(([k, v]) => {
        if (k !== '--' && types.includes(typeof v)) {
            debug('Invalid value "%O" for option "%s"', v, k);
            throw new Error(`Invalid value for option ${k}`);
        }
    });
}
