import arrow_function from './arrow_function';
import as_expression from './as_expression';
import binary_expression from './binary_expression';
import block_like from './block_like';
import class_declaration from './class_declaration';
import declaration_merging from './declaration_merging';
import program_error from './program_error';

describe('Transformation', () => {
  arrow_function();
  as_expression();
  binary_expression();
  block_like();
  class_declaration();
  declaration_merging();
  program_error();
});
