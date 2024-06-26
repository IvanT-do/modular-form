import {mapValues} from "lodash";
import {ModularTouched} from "../types";

export const createTouched = <T extends {}>(data: T, value: boolean = false): ModularTouched => {
    const fn = (val: any): boolean | Record<string, boolean> => {
        if(val && typeof val === "object")
            return mapValues(val, fn) as Record<string, boolean>;
        return value;
    }

    return mapValues(data, fn);
}