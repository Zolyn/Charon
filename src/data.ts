import Conf from 'conf';

export function getUsedTemplatesFromData(): string[] {
    const conf = new Conf();
    return conf.get('templates', []) as string[];
}

export function writeUsedTemplatesToData(templates: string[]) {
    const conf = new Conf();
    conf.set('templates', templates);
}
