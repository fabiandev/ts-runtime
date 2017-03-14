import { Mutator } from './mutators/Mutator';

import { IdentifierMutator } from './mutators/IdentifierMutator';
import { ImportSpecifierMutator } from './mutators/ImportSpecifierMutator';
import { InterfaceDeclarationMutator } from './mutators/InterfaceDeclararionMutator';

export const mutators: Mutator[] = [
  new IdentifierMutator(),
  new ImportSpecifierMutator(),
  new InterfaceDeclarationMutator()
];
