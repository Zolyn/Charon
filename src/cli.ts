#!/usr/bin/env node
import { cac } from 'cac';
import Conf from 'conf';
import prompts from 'prompts';
import ora from 'ora';
import { red, green } from 'picocolors';
import logSymbols from 'log-symbols';
import updateNotifier from 'update-notifier';
import packageJson from '../package.json';
import { resolveOptions } from './options';
import { wrapPromise } from '@zolyn/utils';
import { downloadRepo } from './download';
import { replacePkgContent } from './pkg';

updateNotifier({ pkg: packageJson }).notify();

const cli = cac('charon');

cli.version(packageJson.version).help();

cli.command('')
    .option('-t, --template [repo]', 'Template repository')
    .option('-d, --dest <path>', 'Destination')
    .option('-p, --preserve', 'Preserve the files if the destination is not empty')
    .option('-o, --overwrite', 'Overwrite the files if the destination is not empty')
    // CLI only options
    .option('-n, --name', 'Project name')
    .option('-a, --author', 'Project author')
    .action(async args => {
        const shouldDisplayPrompt = ['boolean', 'undefined'].includes(typeof args.template);
        const conf = new Conf();
        const templates = conf.get('templates', []) as string[];
        let projectAuthor = (args.author || conf.get('author')) as string | undefined;
        let projectName = args.name as string | undefined;

        if (shouldDisplayPrompt) {
            const onCancel = () => {
                console.error(logSymbols.error, red('Aborting'));
                process.exit(1);
            };

            const response = await prompts(
                [
                    templates.length
                        ? {
                              type: 'autocomplete',
                              name: 'template',
                              message: 'Choose a template to init.',
                              choices: [...templates.map(t => ({ title: t })), { title: 'Custom' }],
                          }
                        : {
                              type: 'text',
                              name: 'template',
                              message: 'Please type a template to init.',
                              validate(input: string) {
                                  return !!input || 'Error: Requires value.';
                              },
                          },
                    {
                        type(prev: string) {
                            if (prev === 'Custom') {
                                return 'text';
                            }

                            return null;
                        },
                        name: 'customTemplate',
                        message: 'Please type a template to init.',
                        validate(input: string) {
                            return !!input || 'Error: Requires value.';
                        },
                    },
                    {
                        type: () => (projectName ? 'text' : null),
                        name: 'name',
                        message: 'Specify a name of your project. (Enter to skip)',
                    },
                    {
                        type: () => (projectAuthor ? 'text' : null),
                        name: 'author',
                        message: 'Specify the author name of your project. (Enter to skip)',
                    },
                ],
                { onCancel },
            );

            args.template = response.customTemplate || response.template;
            projectName = response.name;
            projectAuthor = response.author;
        }

        const options = resolveOptions(args);
        templates.push(options.template);

        const downloadSpinner = ora('Downloading repo').start();
        const [downloadErr] = await wrapPromise(downloadRepo(options));

        if (downloadErr) {
            downloadSpinner.fail('Failed');
            console.error(red(String(downloadErr)));
            process.exit(1);
        }

        if (!(projectName && projectAuthor)) {
            downloadSpinner.succeed();
            console.log(logSymbols.success, green('Done.'));
            conf.set('templates', templates);
            return;
        }

        const pkgSpinner = ora('Writing package.json').start();
        const [writePkgErr] = await wrapPromise(
            replacePkgContent(options.dest, {
                name: projectName,
                author: projectAuthor,
            }),
        );

        if (writePkgErr) {
            pkgSpinner.fail('Failed');
            console.error(red(String(writePkgErr)));
            process.exit(1);
        }

        pkgSpinner.succeed();
        console.log(logSymbols.success, green('Done.'));
        conf.set('templates', templates);
    });

cli.command('config', 'Edit config')
    .option('--author [name]', 'Get or set author name')
    .option('--clear', 'Clear config')
    .action(args => {
        const conf = new Conf();
        const isGetAuthor = typeof args.author === 'boolean';
        const isSetAuthor = typeof args.author === 'string';

        if (args.clear) {
            conf.clear();
        }

        if (isGetAuthor) {
            console.log(logSymbols.info, `${conf.get('author')}`);
        } else if (isSetAuthor) {
            conf.set('author', args.author);
            console.log(logSymbols.success, green('Done.'));
        }
    });

cli.parse();
