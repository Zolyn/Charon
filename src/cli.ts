#!/usr/bin/env node
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
import { createPrompt, getConf, getLocalPkg, getOrSetValue } from './utils';

const { red, green } = picocolors;

const debug = debugFn('Charon:cli');

const localPkg = getLocalPkg();

debug('Checking updates');
updateNotifier({ pkg: localPkg }).notify();

debug('Creating CLI instance');
const cli = cac('charon');

cli.version(localPkg.version).help();

cli.command('')
    .option('-t, --template [repo]', 'Template repository')
    .option('-d, --dest <path>', 'Destination')
    .option(
        '-m, --mode <mode>',
        'Mode for extracting git repository. Available options: "normal" | "preserve" | "overwrite" (Default: "normal)"',
    )
    .option('-n, --name [name]', 'Project name')
    .option('-a, --author [author]', 'Project author')
    .option('-s, --skip', 'Skip prompts')
    // Aliases
    .option(
        '-p, --preserve',
        'Preserve the files if the destination is not empty. Same as "-m preserve" (High priority when use with "-o")',
    )
    .option('-o, --overwrite', 'Overwrite the files if the destination is not empty. Same as "-m overwrite"')
    .action(async args => {
        debug('Args %O', args);
        const isTemplateEmpty = ['boolean', 'undefined'].includes(typeof args.template);

        const conf = getConf();
        debug('Conf %O', conf.store);

        const templates = conf.get('templates', []) as string[];
        args.author ??= conf.get('author');
        args.mode ??= conf.get('mode');

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
            if (!args.template) {
                debug('Skip prompts, but "template" is empty');
                console.error(logSymbols.error, red('Option "--template" requires value.'));
                process.exit(1);
            }
        } else if (isTemplateEmpty) {
            if (templates.length) {
                const { template, customTemplate } = await createPrompt([
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
                        message: 'Please type a template to init.',
                        required: true,
                    },
                ]);

                args.template = customTemplate || template;
            } else {
                args.template = await createPrompt({
                    name: 'template',
                    message: 'Please type a template to init',
                    required: true,
                });
            }
        }

        if (!args.skip) {
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

        const downloadSpinner = ora('Downloading repo').start();
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

cli.command('config', 'Edit config')
    .option('--author [name]', 'Get or set the author name')
    .option('--mode [mode]', 'Get or set the mode for extracting git repositories')
    .option('--prompt [switch]', 'Get or set the behavior of prompting')
    .option('-c, --clear [scope]', 'Leave the value to clear config. Or use "-c templates" to clear used templates')
    .action(args => {
        const debugConfig = debug.extend('config');

        const argsLength = Object.keys(args).length;

        if (argsLength === 1) {
            cli.outputHelp();
            return;
        }

        const conf = getConf();

        if (args.clear) {
            if (typeof args.clear === 'boolean') {
                debugConfig('Clear config');

                ['author', 'mode', 'prompt'].forEach(key => conf.delete(key));

                console.log(logSymbols.success, green('Done.'));
                return;
            } else if (args.clear === 'templates') {
                debugConfig('Clear templates');

                conf.delete('templates');

                console.log(logSymbols.success, green('Done.'));
                return;
            } else {
                debug('Invalid scope "%s"', args.clear);
                console.error(logSymbols.error, red(`Invalid scope "${args.clear}". See "-h" for available options.`));
                process.exit(1);
            }
        }

        debugConfig('Get or set "author" if specified');
        getOrSetValue({
            conf,
            key: 'author',
            value: args.author,
        });

        debugConfig('Get or set "mode" if specified');
        getOrSetValue({
            conf,
            key: 'mode',
            value: args.mode,
            validator: val => ['normal', 'preserve', 'overwrite'].includes(val),
        });

        debugConfig('Get or set "prompt" if specified');
        getOrSetValue({
            conf,
            key: 'prompt',
            value: args.prompt,
            validator: val => ['true', 'false'].includes(val),
        });
    });

cli.parse();
