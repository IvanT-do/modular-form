import {createContext, PropsWithChildren, useRef, useState} from "react";
import {ModularForm} from "../classes";

const context = createContext<ModularForm | null>(null);

export default function ModularFormProvider(props: PropsWithChildren) {
    const [form] = useState(() => new ModularForm());

    const formRef = useRef<ModularForm>()

    return (
        <context.Provider value={form}>
            { props.children }
        </context.Provider>
    );
}