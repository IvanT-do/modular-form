import {ModularForm} from "./index";
import {InitialValueGetter, SubmitModifier, ValidationFn} from "../types/module";
import {ModularErrors, ModularTouched, ModularValues} from "../types";
import {cloneDeep, isEqual, set} from "lodash";
import {createTouched} from "../utils";

//общий счетчик для уникального id модуля
let moduleCounter = 0;

type SubmitValue = unknown

export default class ModularModule {
    id: number;
    form: ModularForm;

    name: string = "";

    // функция для валидации значений модуля
    validation?: ValidationFn;

    // начальное значение, которое применится при сбросе формы
    initialValues?: ModularValues;
    // функция-генератор начального значения
    initialValuesGetter?: InitialValueGetter;

    //последнее значение, с которым инициализирован модуль
    lastInitialValues?: ModularValues;

    submitModifier?: SubmitModifier<SubmitValue>;

    constructor(form: ModularForm) {
        this.id = ++moduleCounter;
        this.form = form;
    }

    get values(): ModularValues {
        return this.form.state[this.id];
    }

    set values(value) {
        this.form.setValues(this.id, value);
    }

    get errors(): ModularErrors {
        return this.form.errors[this.id];
    }

    set errors(value) {
        this.form.setErrors(this.id, value);
    }

    get touched(): ModularTouched {
        return this.form.touched[this.id];
    }

    set touched(value) {
        this.form.setTouched(this.id, value);
    }

    //Функция определения изменения значений. true означает, что значения отличаются от начальных
    get dirty(): boolean {
        if (this.lastInitialValues && this.values) {
            return isEqual(this.lastInitialValues, this.values);
        }
        return false;
    }

    //Функция проверки валидности значений модуля на основании ошибок
    get isValid(): boolean {
        const checkValid = (errors: any): boolean => {
            const keys = Object.keys(errors)
            if (keys.length === 0) {
                return true;
            }

            return keys.every(key => {
                if (errors[key] && typeof errors[key] === "object") {
                    return checkValid(errors[key]);
                }
                //всё, что можно привести к true кроме объектов делает значение невалидным
                return !errors[key];
            });
        }

        return checkValid(this.errors);
    }

    _remove() {
        this.form._removeModule(this.id);
    }

    async init(initialData?: unknown): Promise<void> {

        const initialValues = this.initialValuesGetter
            ? await this.initialValuesGetter(initialData)
            : this.initialValues ?? {};
        this.lastInitialValues = cloneDeep(initialValues);

        await this.setValues(cloneDeep(initialValues), false);

        //установлено значение touched для стартовых значений
        await this.setTouched(createTouched(initialValues), false);

        this.setErrors({});
        return;
    }

    setInitialValues(values: ModularValues | InitialValueGetter): ModularModule {
        if (typeof values === "function") {
            this.initialValuesGetter = values;
        } else {
            this.initialValues = values;
        }
        return this;
    }

    setName(name: string): ModularModule {
        this.name = name;
        return this;
    }

    async touchAllFields(): Promise<ModularModule> {
        await this.setTouched(createTouched(this.touched, true), true);
        return this;
    }

    setValidation(validateFn: ValidationFn): ModularModule {
        this.validation = validateFn;
        return this;
    }

    async validate(): Promise<ModularErrors> {
        this.errors = this.validation ? await this.validation(this.values) : {};
        return this.errors;
    }

    setSubmitModifier(modifier: SubmitModifier<SubmitValue>): ModularModule {
        this.submitModifier = modifier;
        return this;
    }

    async getSubmitValue(): Promise<SubmitValue> {
        if (!this.submitModifier) {
            return this.values;
        }
        return this.submitModifier(this.values);
    }

    async setValues(values: ModularValues, validate: boolean = true): Promise<void> {
        this.values = cloneDeep(values);
        validate && await this.validate();
        return;
    }

    async setFieldValue(fieldName: string, value: unknown, validate: boolean = true): Promise<void> {
        set(this.values, fieldName, value);
        validate && await this.validate();
        return;
    }

    async setTouched(touched: ModularTouched, validate: boolean = true): Promise<void> {
        this.touched = touched;
        validate && await this.validate();
        return;
    }

    async setFieldTouched(fieldName: string, value: boolean, validate: boolean = true): Promise<void> {
        set(this.touched, fieldName, value);
        validate && await this.validate();
        return;
    }

    setErrors(errors: ModularErrors): void {
        this.errors = errors;
    }

    _updateContext() {

    }
}