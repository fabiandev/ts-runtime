import arrow_function from './arrow_function';
import as_expression from './as_expression';
import binary_expression from './binary_expression';
import block_like from './block_like';
import class_declaration from './class_declaration';
import declaration_merging from './declaration_merging';
import function_declaration from './function_declaration';
import function_expression from './function_expression';
import interface_declaration from './interface_declaration';
import program_error from './program_error';
import source_file from './source_file';
import type_alias_declaration from './type_alias_declaration';
import variable_declaration_list from './variable_declaration_list';

describe('Transformation', () => {
  arrow_function();
  as_expression();
  binary_expression();
  block_like();
  class_declaration();
  declaration_merging();
  function_declaration();
  function_expression();
  interface_declaration();
  program_error();
  source_file();
  type_alias_declaration();
  variable_declaration_list();
});
