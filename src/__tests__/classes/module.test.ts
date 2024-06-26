import {describe, expect, it, jest} from '@jest/globals';
import {ModularForm} from "../../classes";
import {isEqual} from "lodash";
import {InitialValueGetter} from "../../types/module";

describe("Инициализация и отключение модуля", () => {
    it("При регистрации модуля в форме создаются объекты его данных", () => {
        const form = new ModularForm();
        expect(form.submitCount).toBe(0);

        const module = form.registerModule();
        const module2 = form.registerModule();

        expect(form._modules[module.id]).toBeDefined();
        expect(form.state[module.id]).toBeDefined();
        expect(form.errors[module.id]).toBeDefined();
        expect(form.touched[module.id]).toBeDefined();

        expect(form._modules[module2.id]).toBeDefined();
        expect(form.state[module2.id]).toBeDefined();
        expect(form.errors[module2.id]).toBeDefined();
        expect(form.touched[module2.id]).toBeDefined();

        expect(form.submitCount).toBe(0);
        expect(form.modules.length).toBe(2);
    });

    it("Корректно назначается имя модуля", () => {
        const form = new ModularForm();

        const module = form.registerModule();
        module.setName("new.module");
        expect(module.name).toBe("new.module");
        module.setName("message");
        expect(module.name).toBe("message");

        const module2 = form.registerModule();
        module2.setName("module2");
        expect(module2.name).toBe("module2");
        module2.setName("domain");
        expect(module2.name).toBe("domain");
    })

    describe("Стартовое значение", () => {
        it("При установке стартового значения модуля, основное значение не изменяется", () => {
            const form = new ModularForm();
            const module = form.registerModule();

            const mainInitialValues = module.lastInitialValues;

            const initialValues = module.initialValues;
            const initialValuesGetter = module.initialValuesGetter;

            const newValue = {a: "1", b: "2"};
            module.setInitialValues(newValue);

            //стартовые значения изменяются только те, которые были переданы
            expect(module.initialValues).not.toBe(initialValues);
            expect(module.initialValuesGetter).toBe(initialValuesGetter);
            expect(module.initialValues).toBe(newValue);

            expect(module.lastInitialValues).toBe(mainInitialValues);

            //проверяем установку функции генератора стартовых значений
            const newValue2 = {a: "3"};
            const valueGetter = jest.fn(() => newValue2);
            module.setInitialValues(valueGetter);

            //стартовые значения изменяются только те, которые были переданы
            expect(module.initialValues).toBe(newValue);
            expect(module.initialValuesGetter).not.toBe(initialValuesGetter);
            expect(module.initialValuesGetter).toBe(valueGetter);

            expect(module.lastInitialValues).toBe(mainInitialValues);

            expect(valueGetter).not.toHaveBeenCalled();
        })

        it("Без установки initialData, стартовым значением становится пустой объект", async () => {
            const form = new ModularForm();
            const module = form.registerModule();

            expect(module.lastInitialValues).not.toBeDefined();

            await module.init();

            expect(isEqual(module.lastInitialValues, {})).toBeTruthy();
            expect(isEqual(module.values, {})).toBeTruthy();
            expect(isEqual(module.touched, {})).toBeTruthy();
            expect(isEqual(module.errors, {})).toBeTruthy();
        })

        it("Корректно устанавливается стартовое значение", async () => {
            const form = new ModularForm();
            const module = form.registerModule();

            expect(module.lastInitialValues).not.toBeDefined();

            const initialValues = {a: "1", b: "2", c: {d: "6"}, e: ["10", "11", "12"]};
            module.setInitialValues(initialValues);
            await module.init();

            // lastInitialValues должен иметь другую ссылку, а значения соответствуют
            expect(module.lastInitialValues).not.toBe(initialValues);
            expect(isEqual(module.lastInitialValues, initialValues)).toBeTruthy();

            expect(module.values).not.toBe(initialValues);
            expect(isEqual(module.values, initialValues)).toBeTruthy();

            expect(isEqual(module.touched, {
                a: false,
                b: false,
                c: {
                    d: false
                },
                e: {
                    0: false,
                    1: false,
                    2: false,
                }
            })).toBeTruthy();
            expect(isEqual(module.errors, {})).toBeTruthy();
        })

        it("Корректно генерируется стартовое значение", async () => {
            const form = new ModularForm();
            const module = form.registerModule();

            const initialValues = {a: "1", c: {d: "6"}, e: ["10", "11"]};
            const valuesGenerator = jest.fn(() => initialValues);
            module.setInitialValues(valuesGenerator);

            await module.init();

            // lastInitialValues должен иметь другую ссылку, а значения соответствуют
            expect(module.lastInitialValues).not.toBe(initialValues);
            expect(isEqual(module.lastInitialValues, initialValues)).toBeTruthy();

            //проверяем что ссылки разные, но значения равны
            expect(module.values).not.toBe(initialValues);
            expect(isEqual(module.values, initialValues)).toBeTruthy();

            expect(valuesGenerator).toBeCalledTimes(1);

            expect(isEqual(module.touched, {
                a: false,
                c: {
                    d: false
                },
                e: {
                    0: false,
                    1: false,
                }
            })).toBeTruthy();
            expect(isEqual(module.errors, {})).toBeTruthy();
        })

        it("Асинхронно генерируется стартовое значение", async () => {
            const form = new ModularForm();
            const module = form.registerModule();

            const initialValues = {a: "1", c: {d: "6"}, e: ["10", "11"]};
            const valuesGenerator = jest.fn(() => new Promise((res) => setTimeout(res, 100, initialValues)));
            module.setInitialValues(valuesGenerator as InitialValueGetter);

            await module.init();

            // lastInitialValues должен иметь другую ссылку, а значения соответствуют
            expect(module.lastInitialValues).not.toBe(initialValues);
            expect(isEqual(module.lastInitialValues, initialValues)).toBeTruthy();

            expect(module.values).not.toBe(initialValues);
            expect(isEqual(module.values, initialValues)).toBeTruthy();

            expect(valuesGenerator).toBeCalledTimes(1);
            expect(valuesGenerator.mock.calls[0].length).toBe(0);

            expect(isEqual(module.touched, {
                a: false,
                c: {
                    d: false
                },
                e: {
                    0: false,
                    1: false,
                }
            })).toBeTruthy();
            expect(isEqual(module.errors, {})).toBeTruthy();
        })

        it("Стартовое значение генерируется на основании внешних данных", async () => {
            const form = new ModularForm();
            const module = form.registerModule();

            //внешние стартовые данные
            const startValues = {a: "1", c: {d: "6"}, e: ["10", "11"]};

            const valuesGenerator = jest.fn((value: typeof startValues) => ({value: value.a}));
            module.setInitialValues(valuesGenerator);

            await module.init(startValues);

            expect(isEqual(module.lastInitialValues, {value: startValues.a})).toBeTruthy();
            expect(isEqual(module.values, {value: startValues.a})).toBeTruthy();

            expect(valuesGenerator).toBeCalledTimes(1);
            expect(valuesGenerator.mock.calls[0][0]).toBe(startValues);

            expect(isEqual(module.touched, {value: false})).toBeTruthy();
            expect(isEqual(module.errors, {})).toBeTruthy();
        });
    });

    it("Валидация устанавливается", () => {
        const form = new ModularForm();
        const module = form.registerModule();

        expect(module.validation).toBeUndefined();

        const validation = jest.fn(() => ({}));
        module.setValidation(validation);

        expect(module.validation).toBe(validation);
        expect(validation).not.toBeCalled();
    })

    it("Модификатор отправки данных устанавливается", () => {
        const form = new ModularForm();
        const module = form.registerModule();

        expect(module.submitModifier).toBeUndefined();

        const submitModifier = jest.fn((value: any) => value);
        module.setSubmitModifier(submitModifier);

        expect(module.submitModifier).toBe(submitModifier);
        expect(submitModifier).not.toBeCalled();
    })

    // it("", () => {
    //
    // })
})

describe("Валидация модуля", () => {

})
