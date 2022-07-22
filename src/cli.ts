#!/usr/bin/env node
/* eslint-disable no-param-reassign */
import { wrapPromise } from '@zolyn/utils';
import { cac } from 'cac';
import debugFn from 'debug';
import fuzzy from 'fuzzy';
import logSymbols from 'log-symbols';
import ora from 'ora';
import picocolors from 'picocolors';
import updateNotifier from 'update-notifier';
import { downloadRepo } from './download';
import { resolveOptions } from './options';
import { replacePkgContent } from './pkg';
import { ConfigKeys, Validator } from './types';
import { checkInvalidTypes, createPrompt, getConf, getLocalPkg, getOrSetValue } from './utils';

const { red, green } = picocolors;

const debug = debugFn('Charon:cli');

const localPkg = getLocalPkg();

debug('Checking updates');
updateNotifier({ pkg: localPkg }).notify();

debug('Creating CLI instance');
const cli = cac('charon');

cli.version(localPkg.version).help();

cli.command('[template]', 'Template repository')
    .option('-d, --dest <path>', 'Destination')
    .option(
        '-m, --mode <mode>',
        'Mode for extracting git repositories. Available options: "normal" | "preserve" | "overwrite" (Default: "normal)"',
    )
    .option('-n, --name [name]', 'Project name')
    .option('-a, --author [author]', 'Project author')
    .option('-s, --skip', 'Skip prompts')
    .option('-g, --git', '[WIP] Initialize a git repository after downloading template. (Default: false)')
    // Aliases
    .option(
        '-p, --preserve',
        'Preserve the files if the destination is not empty. Same as "-m preserve" (High priority when use with "-o")',
    )
    .option('-o, --overwrite', 'Overwrite the files if the destination is not empty. Same as "-m overwrite"')
    .action(async (template, args) => {
        debug('Template: "%s"', template);
        debug('Args %O', args);

        checkInvalidTypes(args, ['number', 'object']);

        const conf = getConf();
        debug('Conf %O', conf.store);

        const templates = conf.get('templates', []) as string[];
        args.author ??= conf.get('author');
        args.mode ??= conf.get('mode');
        args.skip ??= conf.get('skip');

        if (args.mode && !['normal', 'preserve', 'overwrite'].includes(args.mode)) {
            debug('Invalid mode "%s"', args.mode);
            console.error(logSymbols.error, red(`Invalid mode "${args.mode}". See "-h" for available options.`));
            process.exit(1);
        }

        if (args.overwrite) {
            args.mode = 'overwrite';
        }

        if (args.preserve) {
            args.mode = 'preserve';
        }

        if (args.skip) {
            if (!template) {
                debug('Skip prompts, but "template" is empty');
                console.error(logSymbols.error, red('Option "--template" requires value.'));
                process.exit(1);
            }
        } else {
            if (!template) {
                if (templates.length) {
                    const { template: _template, customTemplate } = await createPrompt([
                        {
                            name: 'template',
                            type: 'autocomplete',
                            message: 'Choose a template to init.',
                            promptOptions: {
                                suggest: (input, choices) =>
                                    Promise.resolve(choices.filter(choice => fuzzy.test(input, choice.title))),
                                choices: [...templates.map(t => ({ title: t })), { title: 'Custom' }],
                            },
                        },
                        {
                            name: 'customTemplate',
                            when: prev => prev === 'Custom',
                            message: 'Please specify a template to init.',
                            required: true,
                        },
                    ]);

                    template = customTemplate || _template;
                } else {
                    template = await createPrompt({
                        name: 'template',
                        message: 'Please specify a template to init',
                        required: true,
                    });
                }
            }

            args.name ??= await createPrompt({
                name: 'name',
                message: 'Specify a name of your project.',
            });

            args.author ??= await createPrompt({
                name: 'author',
                message: 'Specify the author name of your project.',
            });
        }

        const options = resolveOptions(args);
        debug('ResolvedOptions %O', options);

        templates.push(options.template);

        const downloadSpinner = ora('Downloading template').start();
        const [downloadErr] = await wrapPromise(downloadRepo(options));

        if (downloadErr) {
            downloadSpinner.fail('Failed');
            console.error(red(String(downloadErr)));
            process.exit(1);
        }

        downloadSpinner.succeed();
        conf.set('templates', [...new Set(templates)]);

        if (!(options.name || options.author)) {
            console.log(logSymbols.success, green('Done.'));
            return;
        }

        const pkgSpinner = ora('Writing package.json').start();
        const [writePkgErr] = await wrapPromise(replacePkgContent(options));

        if (writePkgErr) {
            pkgSpinner.fail('Failed');
            console.error(red(String(writePkgErr)));
            process.exit(1);
        }

        pkgSpinner.succeed();
        console.log(logSymbols.success, green('Done.'));
    });

/**
 * We temporarily use options to edit config since CAC does not support subcommands.
 */
cli.command('config', 'Edit config')
    .alias('c')
    .alias('co')
    .option('--author [name]', 'Project author')
    .option('--mode [mode]', 'Mode for extracting git repositories')
    .option('--skip [switch]', 'Whether to skip prompts')
    .option('--git', 'Whether to initialize a git repository after downloading template')
    .option('-c, --clear', 'Clear config')
    .action(args => {
        const debugConfig = debug.extend('config');
        debugConfig('ConfigArgs %O', args);

        checkInvalidTypes(args, ['number', 'object']);

        const argsLength = Object.keys(args).length;

        if (argsLength === 1) {
            cli.outputHelp();
            return;
        }

        const conf = getConf();

        if (args.clear) {
            debugConfig('Clear config');

            const configKeys: ConfigKeys[] = ['author', 'mode', 'skip', 'git'];
            configKeys.forEach(key => conf.delete(key));

            console.log(logSymbols.success, green('Done.'));
        }

        const booleanValidator: Validator = val => ['true', 'false'].includes(val);

        const argsMap: Record<ConfigKeys, Validator | null> = {
            author: null,
            mode: val => ['normal', 'preserve', 'overwrite'].includes(val),
            skip: booleanValidator,
            git: booleanValidator,
        };

        Object.entries(argsMap).forEach(([k, v]) => {
            debugConfig('Get or set "%s" if specified', k);
            getOrSetValue({
                conf,
                key: k,
                value: args[k],
                validator: v,
            });
        });
    });

cli.command('templates', 'Edit templates')
    .alias('t')
    .alias('te')
    .option('-a, --add [template]', 'Add a template')
    .option('-d, --del [template]', 'Delete a template')
    .option('-l, --list', 'List all templates')
    .option('-c, --clear', 'Clear all templates')
    .action(async args => {
        const debugTemplates = debug.extend('templates');
        debugTemplates('TemplateArgs %O', args);

        checkInvalidTypes(args, ['number', 'object']);

        const argsLength = Object.keys(args).length;

        if (argsLength === 1) {
            cli.outputHelp();
            return;
        }

        const conf = getConf();
        const templates = new Set(conf.get('templates') as string[] | undefined);

        if (args.list) {
            if (templates.size) {
                console.log(logSymbols.info, [...templates]);
            } else {
                debugTemplates('Template is empty. No templates to list');
                console.error(logSymbols.error, 'No templates to list.');
            }

            return;
        }

        if (args.clear) {
            debugTemplates('Clear templates');

            conf.delete('templates');
            console.log(logSymbols.success, green('Done.'));
            return;
        }

        if (typeof args.add === 'boolean') {
            args.add = await createPrompt({
                name: 'template',
                message: 'Specify a template',
            });

            debugTemplates('Arg "add" after prompt: %s', args.add);
        }

        if (args.add) {
            templates.add(args.add);
            conf.set('templates', [...templates]);

            debugTemplates('Added template "%s"', args.add);
            console.log(logSymbols.success, green('Done.'));
            return;
        }
        // Empty string
        else if (typeof args.add === 'string') {
            debugTemplates('Template not specified');
            console.error(logSymbols.error, 'Template not specified.');
            return;
        }

        if (args.del && !templates.size) {
            debugTemplates('Template is empty. No templates to delete');
            console.error(logSymbols.error, 'No templates to delete.');
            return;
        }

        if (typeof args.del === 'boolean') {
            args.del = await createPrompt({
                type: 'autocompleteMultiselect',
                name: 'delTemplates',
                message: 'Select templates to delete',
                promptOptions: {
                    suggest(input, choices) {
                        return Promise.resolve(choices.filter(choice => fuzzy.test(input, choice.title)));
                    },
                    choices: [...templates].map(t => ({ title: t, value: t })),
                    hint: 'Space to select. Return to submit',
                    instructions: false,
                },
            });

            debugTemplates('Arg "del" after prompt: %s', args.del);
        }

        if (Array.isArray(args.del) && args.del.length) {
            args.del.forEach((val: string) => {
                templates.delete(val);
                debugTemplates('Template "%s" was deleted', val);
            });

            conf.set('templates', [...templates]);

            console.log(logSymbols.success, green('Done.'));
        } else if (typeof args.del === 'string') {
            if (templates.delete(args.del)) {
                conf.set('templates', [...templates]);

                debugTemplates('Template "%s" was deleted', args.del);
                console.log(logSymbols.success, green('Done.'));
                return;
            }

            debugTemplates('Template "%s" not found', args.del);
            console.error(logSymbols.error, 'Template not found.');
        } else {
            debugTemplates('Template not specified');
            console.error(logSymbols.error, 'Template not specified.');
        }
    });

cli.parse();
