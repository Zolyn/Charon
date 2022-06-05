import type Conf from 'conf';
import { PromptObject, PromptType } from 'prompts';

export type ExtractMode = 'normal' | 'preserve' | 'overwrite';

export type KeysWithoutDefaults = 'name' | 'author';

export interface CharonOptions extends Partial<Record<KeysWithoutDefaults, string>> {
    template: string;
    dest?: string;
    mode?: ExtractMode;
}

export type DefaultCharonOptions = Required<Omit<CharonOptions, 'template' | KeysWithoutDefaults>>;

export type ResolvedCharonOptions = Required<Omit<CharonOptions, KeysWithoutDefaults>> & CharonOptions;

export interface CreatePromptOptions<T extends string = string> {
    name: T;
    message: string;
    type?: PromptType;
    required?: boolean;
    when?: (prev: any) => any;
    promptOptions?: Partial<PromptObject>;
}

export interface GetOrSetValueOptions {
    conf: Conf;
    key: string;
    value: any;
    validator?: (val: any) => boolean;
}
