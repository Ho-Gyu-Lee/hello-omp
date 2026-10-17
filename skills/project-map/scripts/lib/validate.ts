// Narrowing helpers for JSON read from receipts and config files; each throws an error naming the offending field.
export type JsonObject = Record<string, unknown>;

export function AsObject(value: unknown, label: string): JsonObject
{
    if (typeof value !== "object" || value === null || Array.isArray(value))
    {
        throw new Error(`${label} must be an object`);
    }

    return value as JsonObject;
}

export function AsArray(value: unknown, label: string): unknown[]
{
    if (!Array.isArray(value))
    {
        throw new Error(`${label} must be an array`);
    }

    return value;
}

export function AsString(value: unknown, label: string): string
{
    if (typeof value !== "string")
    {
        throw new Error(`${label} must be a string`);
    }

    return value;
}

export function AsNumber(value: unknown, label: string): number
{
    if (typeof value !== "number" || !Number.isFinite(value))
    {
        throw new Error(`${label} must be a number`);
    }

    return value;
}

export function AsBoolean(value: unknown, label: string): boolean
{
    if (typeof value !== "boolean")
    {
        throw new Error(`${label} must be true or false`);
    }

    return value;
}

export function AsStringArray(value: unknown, label: string): string[]
{
    return AsArray(value, label).map((item, index) => AsString(item, `${label}[${index}]`));
}

export function AsSha256(value: unknown, label: string): string
{
    const text = AsString(value, label);

    if (!/^[0-9a-f]{64}$/.test(text))
    {
        throw new Error(`${label} must be a lowercase sha256 hex string`);
    }

    return text;
}
