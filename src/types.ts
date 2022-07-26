import type Conf from 'conf';
import { PromptObject, PromptType } from 'prompts';

export type ExtractMode = 'normal' | 'preserve' | 'overwrite';

export type KeysWithoutDefaults = 'name' | 'author' | 'user';

export interface CharonOptions extends Partial<Record<KeysWithoutDefaults, string>> {
    template: string;
    dest?: string;
    mode?: ExtractMode;
    git?: boolean;
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

export type Validator = (val: any) => boolean;

export type Filter = (val: any) => any;

export interface GetOrSetValueOptions {
    conf: Conf;
    key: string;
    value: any;
    validator?: Validator | null;
    filter?: Filter | null;
}

export interface GitUserInfo {
    host: string;
    user: string;
}
