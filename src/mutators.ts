import { Mutator } from './mutators/Mutator';
import { BinaryExpressionMutator } from './mutators/BinaryExpressionMutator';
import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';
import { TypeAliasDeclarationMutator } from './mutators/TypeAliasDeclararionMutator';
import { VariableDeclarationListMutator } from './mutators/VariableDeclarationListMutator';

export {
  Mutator,
  BinaryExpressionMutator,
  InterfaceDeclarationMutator,
  TypeAliasDeclarationMutator,
  VariableDeclarationListMutator
};

export const mutators: Mutator[] = [
  new BinaryExpressionMutator(),
  new InterfaceDeclarationMutator(),
  new TypeAliasDeclarationMutator(),
  new VariableDeclarationListMutator(),
];
