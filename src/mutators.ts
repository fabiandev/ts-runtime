import { Mutator } from './mutators/Mutator';
import { BinaryExpressionMutator } from './mutators/BinaryExpressionMutator';
import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';
import { VariableDeclarationListMutator } from './mutators/VariableDeclarationListMutator';

export {
  Mutator,
  BinaryExpressionMutator,
  InterfaceDeclarationMutator,
  VariableDeclarationListMutator
};

export const mutators: Mutator[] = [
  new BinaryExpressionMutator(),
  new InterfaceDeclarationMutator(),
  new VariableDeclarationListMutator(),
];
