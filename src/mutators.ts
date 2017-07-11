import { Mutator } from './mutators/Mutator';
import { ArrowFunctionMutator } from './mutators/ArrowFunctionMutator';
import { AsExpressionMutator } from './mutators/AsExpressionMutator';
import { BinaryExpressionMutator } from './mutators/BinaryExpressionMutator';
import { BlockLikeMutator } from './mutators/BlockLikeMutator';
import { ClassDeclarationMutator } from './mutators/ClassDeclarationMutator'
import { FunctionDeclarationMutator } from './mutators/FunctionDeclarationMutator';
import { FunctionExpressionMutator } from './mutators/FunctionExpressionMutator';
import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';
import { SourceFileMutator } from './mutators/SourceFileMutator';
import { TypeAliasDeclarationMutator } from './mutators/TypeAliasDeclararionMutator';
import { VariableDeclarationListMutator } from './mutators/VariableDeclarationListMutator';

export {
  Mutator,
  ArrowFunctionMutator,
  AsExpressionMutator,
  BinaryExpressionMutator,
  BlockLikeMutator,
  ClassDeclarationMutator,
  FunctionDeclarationMutator,
  FunctionExpressionMutator,
  InterfaceDeclarationMutator,
  SourceFileMutator,
  TypeAliasDeclarationMutator,
  VariableDeclarationListMutator,
};

export const mutators: (typeof Mutator)[] = [
  ArrowFunctionMutator,
  AsExpressionMutator,
  BinaryExpressionMutator,
  BlockLikeMutator,
  ClassDeclarationMutator,
  FunctionDeclarationMutator,
  FunctionExpressionMutator,
  InterfaceDeclarationMutator,
  SourceFileMutator,
  TypeAliasDeclarationMutator,
  VariableDeclarationListMutator,
];

export function getMutators(): Mutator[] {
  const instances: Mutator[] = [];

  for (let mutator of mutators) {
    instances.push(new (mutator as any)());
  }

  return instances;
}
