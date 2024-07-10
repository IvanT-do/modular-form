import {describe, expect, it, jest} from '@jest/globals';
import {ModularForm} from "../../classes";
import {InitialValueGetter} from "../../types/module";

it("Function setName()", () => {
    const form = new ModularForm();
    const module = form.registerModule();
    module.setName("new.module");
    expect(module.name).toBe("new.module");
    module.setName("message");
    expect(module.name).toBe("message");

    module.unset();
});

it("Function setSubmitModifier()", () => {
    const form = new ModularForm();
    const module = form.registerModule();

    expect(module.submitModifier).toBeUndefined();

    const submitModifier = jest.fn((value: any) => value);
    module.setSubmitModifier(submitModifier);

    expect(module.submitModifier).toBe(submitModifier);
    expect(submitModifier).not.toBeCalled();
})

it("Function setValidation()", () => {
    const form = new ModularForm();
    const module = form.registerModule();

    expect(module.validation).toBeUndefined();

    const validation = jest.fn(() => ({}));
    module.setValidation(validation);

    expect(module.validation).toBe(validation);
    expect(validation).not.toBeCalled();
});

describe("Function setInitialValues()", () => {
    it("Set initialValues not update lastInitialValues", () => {
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

    it("Set initialValues is correct", async () => {
        const form = new ModularForm();
        const initialValues = {a: "1", b: "2", c: {d: "6"}, e: ["10", "11", "12"]};

        const module = form.registerModule<typeof initialValues>();

        expect(module.lastInitialValues).not.toBeDefined();

        await module
            .setInitialValues(initialValues)
            .init();

        // lastInitialValues должен иметь другую ссылку, а значения соответствуют
        expect(module.lastInitialValues).not.toBe(initialValues);
        expect(module.lastInitialValues).toEqual(initialValues);

        //значение имеет другую ссылку
        expect(module.values).not.toBe(initialValues);
        expect(module.values).toEqual(initialValues);

        expect(module.touched).toEqual({
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
        });
        expect(module.errors).toEqual({});
    })

    it("InitialValue can be generated", async () => {
        const form = new ModularForm();
        const module = form.registerModule();

        const initialValues = {a: "1", c: {d: "6"}, e: ["10", "11"]};
        const valuesGenerator = jest.fn(() => initialValues);
        module.setInitialValues(valuesGenerator);

        expect(valuesGenerator).not.toBeCalled();

        await module.init();

        // lastInitialValues должен иметь другую ссылку, а значения соответствуют
        expect(module.lastInitialValues).not.toBe(initialValues);
        expect(module.lastInitialValues).toEqual(initialValues);

        //проверяем что ссылки разные, но значения равны
        expect(module.values).not.toBe(initialValues);
        expect(module.values).toEqual(initialValues);

        expect(valuesGenerator).toBeCalledTimes(1);

        expect(module.touched).toEqual({
            a: false,
            c: {
                d: false
            },
            e: {
                0: false,
                1: false,
            }
        });
        expect(module.errors).toEqual({});


    })

    it("InitialValue can be generated asynchronously", async () => {
        const form = new ModularForm();
        const module = form.registerModule();

        const initialValues = {a: "1", c: {d: "6"}, e: ["10", "11"]};
        const valuesGenerator = jest.fn(() => new Promise((res) => setTimeout(res, 100, initialValues)));
        module.setInitialValues(valuesGenerator as InitialValueGetter<typeof initialValues>);

        await module.init();

        // lastInitialValues должен иметь другую ссылку, а значения соответствуют
        expect(module.lastInitialValues).not.toBe(initialValues);
        expect(module.lastInitialValues).toEqual(initialValues);

        expect(module.values).not.toBe(initialValues);
        expect(module.values).toEqual(initialValues);

        expect(valuesGenerator).toBeCalledTimes(1);

        expect(module.touched).toEqual({
            a: false,
            c: {
                d: false
            },
            e: {
                0: false,
                1: false,
            }
        });
        expect(module.errors).toEqual({});
    })

    it("InitialValue can be generated based on external data", async () => {
        const form = new ModularForm();
        const module = form.registerModule();

        //внешние стартовые данные
        const startValues = {a: "1", c: {d: "6"}, e: ["10", "11"]};

        const valuesGenerator = jest.fn((value: typeof startValues) => ({value: value.a}));
        module.setInitialValues(valuesGenerator);

        await module.init(startValues);

        expect(module.lastInitialValues).toEqual({value: startValues.a});
        expect(module.values).toEqual({value: startValues.a});

        expect(valuesGenerator).toBeCalledTimes(1);
        expect(valuesGenerator.mock.calls[0][0]).toBe(startValues);

        expect(module.touched).toEqual({value: false});
        expect(module.errors).toEqual({});
    });
});

it("Removing module", () => {
    const form = new ModularForm();
    expect(form.modules).toHaveLength(0);

    const module = form.registerModule();

    expect(form.modules).toContain(module);

    expect(form.state[module.id]).toBeDefined();
    expect(form.errors[module.id]).toBeDefined();
    expect(form.touched[module.id]).toBeDefined();

    module.unset();

    expect(form.modules).not.toContain(module);

    expect(form.state[module.id]).toBeUndefined();
    expect(form.errors[module.id]).toBeUndefined();
    expect(form.touched[module.id]).toBeUndefined();
})

describe("Function setFieldValue()", () => {
    const form = new ModularForm();

    it("Can change single values", async () => {
        const module = form.registerModule<{ message: string, counter: number }>();
        await module
            .setInitialValues({
                message: "hello",
                counter: 0
            })
            .init();

        expect(module.values.message).toBe("hello");
        expect(module.values.counter).toBe(0);

        await module.setFieldValue("message", "world", false);

        expect(module.values.message).toBe("world");
        expect(module.values.counter).toBe(0);

        await module.setFieldValue("message", "!!!", true);

        expect(module.values.message).toBe("!!!");
        expect(module.values.counter).toBe(0);

        await module.setFieldValue("counter", module.values.counter as number + 5, false);

        expect(module.values.message).toBe("!!!");
        expect(module.values.counter).toBe(5);

        await module.setFieldValue("counter", module.values.counter as number + 3, true);

        expect(module.values.message).toBe("!!!");
        expect(module.values.counter).toBe(8);

        module.unset();
    });

    it("Can change nested values", async () => {
        const module = form.registerModule<{
            foo: {
                bar: {
                    baz: string
                },
                val: number | null,
                "baz.bar": string,
                arr: Array<any>
            }
        }>();

        await module
            .setInitialValues({
                foo: {
                    bar: {
                        baz: "hello world"
                    },
                    val: null,
                    arr: ["a", 1, 2, null],
                    "baz.bar": "some value",
                }
            })
            .init();

        expect(module.values.foo.arr).toEqual(["a", 1, 2, null]);

        //корректно устанавливается значение на уровень 2
        expect(module.values.foo.val).toBeNull();
        await module.setFieldValue("foo.val", 999);
        expect(module.values.foo.val).toBe(999);

        //корректно устанавливается значение на уровень 3
        expect(module.values.foo.bar.baz).toBe("hello world");
        await module.setFieldValue("foo.bar.baz", "new value");
        expect(module.values.foo.bar.baz).toBe("new value");

        //корректно устанавливается элемент массива
        expect(module.values.foo.arr[3]).toBeNull();
        await module.setFieldValue("foo.arr[3]", "not null");
        expect(module.values.foo.arr[3]).toBe("not null");

        //корректно устанавливается свойство с точкой в названии
        expect(module.values.foo["baz.bar"]).toBe("some value");
        await module.setFieldValue('foo["baz.bar"]', "nice");
        expect(module.values.foo["baz.bar"]).toBe("nice");

        module.unset();
    })

    it("Validate by default", async () => {
        const module = form.registerModule<{ a: string }>();

        const validateFn = jest.fn(() => ({}));
        await module
            .setValidation(validateFn)
            .setInitialValues({a: "1"})
            .init();

        expect(validateFn).not.toBeCalled();

        await module.setFieldValue("a", "foo");

        expect(validateFn).toBeCalledTimes(1);
        expect(validateFn).toBeCalledWith(module.values);

        module.unset();
    })

    it("Validation can be disabled", async () => {
        const module = form.registerModule<{ a: string }>();

        const validateFn = jest.fn(() => ({}));
        await module
            .setValidation(validateFn)
            .setInitialValues({a: "1"})
            .init();

        expect(validateFn).not.toBeCalled();

        await module.setFieldValue("a", "foo", false);

        expect(validateFn).not.toBeCalled();

        module.unset();
    })
});

describe("Function setValues()", () => {
    const form = new ModularForm();

    it("Can change module values", async () => {
        const module = form.registerModule<{
            a: number,
            b: string,
            c: object
        }>();

        await module
            .setInitialValues({
                a: 0,
                b: "",
                c: {d: "20"}
            })
            .init();

        expect(module.values.a).toBe(0);
        expect(module.values.b).toBe("");
        expect(module.values.c).toEqual({d: "20"});

        await module.setValues({
            a: 90,
            b: "new value",
            c: {e: 40}
        });

        expect(module.values.a).toBe(90);
        expect(module.values.b).toBe("new value");
        expect(module.values.c).toEqual({e: 40});

        module.unset();
    });

    it("Validate by default", async () => {
        const module = form.registerModule<{ val: string }>();

        const validationFn = jest.fn(() => ({}));
        await module
            .setValidation(validationFn)
            .setInitialValues({val: "foo"})
            .init();

        expect(validationFn).not.toBeCalled();

        await module.setValues({val: "bar"});

        expect(validationFn).toBeCalledTimes(1);
        expect(validationFn).toBeCalledWith(module.values);

        module.unset();
    })

    it("Validation can be disabled", async () => {
        const module = form.registerModule<{ val: string }>();

        const validationFn = jest.fn(() => ({}));
        await module
            .setValidation(validationFn)
            .setInitialValues({val: "foo"})
            .init();

        expect(validationFn).not.toBeCalled();

        await module.setValues({val: "bar"}, false);

        expect(validationFn).not.toBeCalled();

        module.unset();
    })
})

describe("Function validate()", () => {
    const form = new ModularForm();

    it("If not set validation returns empty object", async () => {
        const module = form.registerModule();

        await module
            .setInitialValues({value: "foo"})
            .init();

        expect(module.validation).toBeUndefined();

        const errors = await module.validate();

        expect(errors).toEqual({});

        expect(module.errors).toBe(errors);

        module.unset();
    })

    it("Validation function called", async () => {
        const module = form.registerModule();

        const validationFn = jest.fn((val: Record<string, any>) => ({
            value: val.value === "foo" ? "default error" : null
        }))

        await module
            .setInitialValues({value: "foo"})
            .setValidation(validationFn)
            .init();

        expect(validationFn).not.toBeCalled();

        const errors = await module.validate();

        expect(validationFn).toBeCalledTimes(1);
        expect(validationFn).toBeCalledWith({value: "foo"});
        expect(errors).toBe(module.errors);

        expect(errors).toEqual({value: "default error"});

        await module.setFieldValue("value", "bar");

        expect(validationFn).toBeCalledTimes(2);
        expect(validationFn).toBeCalledWith({value: "bar"});

        expect(module.errors).toEqual({value: null});

        module.unset();
    })

    it("Correct async validation", async () => {
        const module = form.registerModule<Record<string, any>>();

        const validationFn = jest.fn((val: Record<string, any>) => new Promise<Record<string, any>>((res) => {
            setTimeout(res, 100, {
                value: val.value === "foo" ? "basic error" : null
            });
        }));

        await module
            .setInitialValues({value: "foo"})
            .setValidation(validationFn)
            .init();

        expect(validationFn).not.toBeCalled();

        const errors = await module.validate();

        expect(validationFn).toBeCalledTimes(1);
        expect(validationFn).toBeCalledWith({value: "foo"});
        expect(errors).toBe(module.errors);

        expect(errors).toEqual({value: "basic error"});

        await module.setFieldValue("value", "baz");

        expect(validationFn).toBeCalledTimes(2);
        expect(validationFn).toBeCalledWith({value: "baz"});

        expect(module.errors).toEqual({value: null});

        module.unset();
    })
})

describe("Function init()", () => {
    const form = new ModularForm();

    it("Default initialValues is empty object", async () => {
        const module = form.registerModule();

        expect(module.lastInitialValues).toBeUndefined();

        await module.init();

        expect(module.lastInitialValues).toEqual({});
        expect(module.values).toEqual({});
        expect(module.touched).toEqual({});
        expect(module.errors).toEqual({});
    })

    it("Use actual initialValues", async () => {
        const module = form.registerModule();

        expect(module.lastInitialValues).toBeUndefined();

        await module
            .setInitialValues({value: "foo"})
            .init();

        expect(module.lastInitialValues).toEqual({value: "foo"});
        expect(module.values).toEqual({value: "foo"});

        await module.setFieldTouched("value", true, false);
        await module.setFieldValue("value", "baz", false);
        module.errors.value = "some error";

        expect(module.lastInitialValues).toEqual({value: "foo"});
        expect(module.values).toEqual({value: "baz"});

        module.setInitialValues({value: "bar"});

        expect(module.lastInitialValues).toEqual({value: "foo"});
        expect(module.values).toEqual({value: "baz"});

        await module.init();

        expect(module.lastInitialValues).toEqual({value: "bar"});
        expect(module.values).toEqual({value: "bar"});

        module.unset();
    })

    it("Correctly generate initialValue", async () => {
        const module = form.registerModule();
        // const startValue =

        // const valueGenerator = jest.fn(() => ({}));

        module.unset();
    })

    it("Reset all errors", async () => {
        const module = form.registerModule();

        module.errors.value = "122345";

        expect(module.errors).toEqual({value: "122345"});

        await module.init();

        expect(module.errors).toEqual({});

        module.unset();
    })

    it("Correctly set touched for initialValue", async () => {
        const module = form.registerModule();

        module.setInitialValues({
            a: "foo",
            b: {
                c: 0,
                d: {
                    e: null,
                    f: [0, "4", null]
                }
            },
            g: [123, 456]
        });

        expect(module.touched).toEqual({});

        await module.init();

        expect(module.touched).toEqual({
            a: false,
            b: {
                c: false,
                d: {
                    e: false,
                    f: {
                        0: false,
                        1: false,
                        2: false
                    }
                }
            },
            g: {
                0: false,
                1: false
            }
        });

        module.unset();
    })
})

// it("", () => {
//
// })
