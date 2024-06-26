import {ModularErrors, ModularValues} from "./index";

export type ValidationFn = (values: ModularValues) => ModularErrors | Promise<ModularErrors>;

export type InitialValueGetter = (data: any) => ModularValues | Promise<ModularValues>;

export type SubmitModifier<T> = (values: ModularValues) => T