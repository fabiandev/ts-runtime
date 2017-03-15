import { Mutator } from './mutators/Mutator';

import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';
import { VariableDeclarationListMutator } from './mutators/VariableDeclarationListMutator';

export const mutators: Mutator[] = [
  new InterfaceDeclarationMutator(),
  new VariableDeclarationListMutator(),
];
