import {ModularModule} from "./index";
import {ModularErrors, ModularTouched, ModularValues} from "../types";
import {ModularSubmitValue} from "../types/form";
import {set} from "lodash";

export default class ModularForm{
    _modules: Record<number, ModularModule> = {};

    state: Record<number, ModularValues> = {};
    errors: Record<number, ModularErrors> = {};
    touched: Record<number, ModularTouched> = {};

    isValidating: boolean = false;
    lastValidateError: boolean = false;

    isSubmitting: boolean = false;
    submitCount: number = 0;

    startValue: unknown;

    submitHandler?: (value: ModularSubmitValue<{}>, form: ModularForm) => void | Promise<void>;
    resetHandler?: (form: ModularForm) => void | Promise<void>;

    get modules(){
        return Object.values(this._modules);
    }

    get isValid(){
        return this.modules.every(module => module.isValid);
    }

    get dirty(){
        return this.modules.some(module => module.dirty);
    }

    registerModule(){
        const module = new ModularModule(this);

        this._modules[module.id] = module;

        this.state[module.id] = {};
        this.errors[module.id] = {};
        this.touched[module.id] = {};

        return module;
    }

    _removeModule(id: number): void {
        delete this._modules[id];
        delete this.state[id];
        delete this.errors[id];
        delete this.touched[id];
    }

    async setStartValue(value: unknown, reset: boolean = false): Promise<ModularForm> {
        this.startValue = value;
        reset && await this.resetForm();
        return this;
    }

    setSubmitting(isSubmitting: boolean): ModularForm {
        this.isSubmitting = isSubmitting;
        return this;
    }

    async submitForm(): Promise<void> {
        this.modules.forEach(module => module.touchAllFields());
        this.setSubmitting(true);
        this.submitCount++;

        await this.validate();
        if(!this.isValid || this.lastValidateError){
            this.setSubmitting(false);
            return;
        }

        const values: ModularSubmitValue<{}> = {};
        try{
            await Promise.all(this.modules.map(module => module.getSubmitValue().then((value) => {
                set(values, module.name, value);
            })));
        }
        catch (e){
            this.setSubmitting(false);
            return;
        }

        try{
            this.submitHandler && await this.submitHandler(values, this);
        }
        catch{}

        this.setSubmitting(false);
        return;
    }

    async init(): Promise<void>{
        await Promise.all(this.modules.map(module => module.init(this.startValue)));
        return;
    }

    async resetForm(): Promise<void> {
        this.resetHandler && await this.resetHandler(this);

        await this.init();
        return;
    }

    async validate(): Promise<void> {
        this.isValidating = true;
        this.lastValidateError = false;
        try{
            await Promise.all(this.modules.map(module => this._validateModule(module.id)));
        }
        catch (e){
            this.lastValidateError = true;
        }
        this.isValidating = false;
        return;
    }

    async _validateModule(id: number): Promise<void>{
        this.errors[id] = await this._modules[id].validate();
        return;
    }

    setValues(moduleId: number, values: ModularValues): void {
        this.state[moduleId] = values;
    }

    setTouched(moduleId: number, touched: ModularTouched): void {
        this.touched[moduleId] = touched;
    }

    setErrors(moduleId: number, errors: ModularErrors): void {
        this.errors[moduleId] = errors;
    }
}