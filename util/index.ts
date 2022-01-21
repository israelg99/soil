export function getAllValues(obj: any, key: string) {
    const result: string[] = [];
    const recurse = (o: any, k: string) => {
        if (o[k] && typeof o[k] === 'object') {
            Object.keys(o[k]).forEach((i) => recurse(o[k], i));
        } else if (k === key) {
            result.push(o[k]);
        }
    };
    Object.keys(obj).forEach((k) => recurse(obj, k));
    return result;
}

export function setID(obj: any, id: string) {
    const cfn = obj.node.defaultChild as any;
    cfn.overrideLogicalId(id);
}

export function capitalize(str: string, toCamel = true, delimiter?: string) {
    return (str.charAt(0).toUpperCase() + str.slice(1)).replace(
        /(-|_)([a-z])/gi,
        function (g) {
            const up = g[1].toUpperCase();
            const del = delimiter || g[0];
            return toCamel ? up : del + up;
        }
    );
}
