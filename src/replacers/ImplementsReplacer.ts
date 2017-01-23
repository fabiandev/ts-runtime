function replacer(haystack) {
  return haystack.replace(
    /if\s*\((\s*([^)]+?)\s*(implements)\s*([^)]+?)\s*)(\))/g,
    "if(__implements($2, $4))"
  );
}

export default replacer;
