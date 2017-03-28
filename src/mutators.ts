import { Mutator } from './mutators/Mutator';
import { BinaryExpressionMutator } from './mutators/BinaryExpressionMutator';
import { ClassDeclarationMutator } from './mutators/ClassDeclarationMutator'
import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';
import { TypeAliasDeclarationMutator } from './mutators/TypeAliasDeclararionMutator';
import { VariableDeclarationListMutator } from './mutators/VariableDeclarationListMutator';

export {
  Mutator,
  BinaryExpressionMutator,
  ClassDeclarationMutator,
  InterfaceDeclarationMutator,
  TypeAliasDeclarationMutator,
  VariableDeclarationListMutator,
};

export const mutators: Mutator[] = [
  new BinaryExpressionMutator(),
  new ClassDeclarationMutator(),
  new InterfaceDeclarationMutator(),
  new TypeAliasDeclarationMutator(),
  new VariableDeclarationListMutator(),
];
