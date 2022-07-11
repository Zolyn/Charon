export interface CharonOptions {
    template: string;
    dest?: string;
    preserve?: boolean;
    overwrite?: boolean;
}

export type ResolvedCharonOptions = Required<CharonOptions>;
