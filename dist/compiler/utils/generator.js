"use strict";
const ts = require("typescript");
function createTypeDefinition(type, name) {
    return ts.factory.createVariableDeclaration(name, undefined, createTypeCalls(type));
}
exports.createTypeDefinition = createTypeDefinition;
function createTypeCalls(type) {
    if (!type) {
        return null;
    }
    if (typeof type === 'string') {
        return createTypeCall('t', type);
    }
    type = type;
    switch (type.kind) {
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.AnyKeyword:
            {
                return createTypeCall('t', type.getText());
            }
        case ts.SyntaxKind.ArrayType:
            {
                const typeNode = type.elementType;
                const callExpression = createTypeCall('t', 'array', [createTypeCalls(typeNode)]);
                return callExpression;
            }
        case ts.SyntaxKind.TypeReference:
            {
                const typeRef = type;
                const typeName = typeRef.typeName.getText();
                const args = [];
                let callExpression;
                if (typeRef.typeArguments) {
                    for (const arg of typeRef.typeArguments) {
                        args.push(createTypeCalls(arg));
                    }
                }
                if (typeName === 'Array' || typeName === 'array') {
                    callExpression = createTypeCall('t', 'array', args);
                }
                else {
                    callExpression = createTypeCall('t', 'ref', [ts.factory.createIdentifier(typeName)]);
                }
                return callExpression;
            }
        case ts.SyntaxKind.TupleType:
            {
                const typeRef = type;
                const args = [];
                for (const arg of typeRef.elementTypes) {
                    args.push(createTypeCalls(arg));
                }
                return createTypeCall('t', 'tuple', args);
            }
        default:
            {
                return createTypeCall('t', 'any');
            }
    }
}
exports.createTypeCalls = createTypeCalls;
function createTypeCall(id, prop, args = [], types = []) {
    return ts.factory.createCall(ts.factory.createPropertyAccess(ts.factory.createIdentifier(id), prop), types, args);
}
exports.createTypeCall = createTypeCall;
