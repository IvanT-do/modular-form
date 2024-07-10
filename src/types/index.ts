export type ModularValues<T extends {}> = T;
export type ModularTouched<T extends {}> = {
    [K in keyof T]: T[K] extends {} ? boolean | ModularTouched<T[K]> : boolean
};

export type ErrorValues = string | null | undefined;
export type ModularErrors<T extends {}> = {
    [K in keyof T]?: T[K] extends {} ? ErrorValues | ModularErrors<T[K]> : ErrorValues
};
