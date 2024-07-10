import {describe, expect, it} from "@jest/globals";
import {ModularForm} from "../../classes";

describe("Function registerModule()", () => {
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
})

// it("", () => {
//
// })
