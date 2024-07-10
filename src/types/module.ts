import {ModularErrors, ModularValues} from "./index";

export type ValidationFn<Value extends {}> = (values: ModularValues<Value>) => ModularErrors<Value> | Promise<ModularErrors<Value>>;

export type InitialValueGetter<Value extends {}> = (data: any) => ModularValues<Value> | Promise<ModularValues<Value>>;

export type SubmitModifier<Value extends {}, T> = (values: ModularValues<Value>) => T