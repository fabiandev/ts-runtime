import { Mutator } from './mutators/Mutator';
import { ArrowFunctionMutator } from './mutators/ArrowFunctionMutator';
import { BinaryExpressionMutator } from './mutators/BinaryExpressionMutator';
import { BlockLikeMutator } from './mutators/BlockLikeMutator';
import { ClassDeclarationMutator } from './mutators/ClassDeclarationMutator'
import { FunctionExpressionMutator } from './mutators/FunctionExpressionMutator';
import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';
import { TypeAliasDeclarationMutator } from './mutators/TypeAliasDeclararionMutator';
import { VariableDeclarationListMutator } from './mutators/VariableDeclarationListMutator';

export {
  Mutator,
  ArrowFunctionMutator,
  BinaryExpressionMutator,
  BlockLikeMutator,
  ClassDeclarationMutator,
  FunctionExpressionMutator,
  InterfaceDeclarationMutator,
  TypeAliasDeclarationMutator,
  VariableDeclarationListMutator,
};

export const mutators: Mutator[] = [
  new ArrowFunctionMutator(),
  new BinaryExpressionMutator(),
  new BlockLikeMutator(),
  new ClassDeclarationMutator(),
  new FunctionExpressionMutator(),
  new InterfaceDeclarationMutator(),
  new TypeAliasDeclarationMutator(),
  new VariableDeclarationListMutator(),
];
