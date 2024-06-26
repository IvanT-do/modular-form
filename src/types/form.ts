import {ModularForm} from "../classes";

export type ModularSubmitValue<T extends Record<string, unknown>> = Record<string, unknown>/*{
    [K in keyof T]:
}*/

export interface FormProviderContext {
    form: ModularForm
}