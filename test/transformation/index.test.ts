import arrow_function from './arrow_function';
import as_expression from './as_expression';
import binary_expression from './binary_expression';
import block_like from './block_like';
import class_declaration from './class_declaration';

describe('Transformation', () => {
  arrow_function();
  as_expression();
  binary_expression();
  block_like();
  class_declaration();
});
