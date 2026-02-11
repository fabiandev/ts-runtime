module.exports = function commondir(paths) {
  if (!paths || paths.length === 0) return '/';
  return paths[0];
};
