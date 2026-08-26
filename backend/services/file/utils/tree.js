export const buildTree = (files) => {
  const map = {};
  const tree = [];

  // Create map
  files.forEach((file) => {
    map[file._id.toString()] = {
      ...file.toObject(),
      children: [],
    };
  });

  // Build hierarchy
  files.forEach((file) => {
    const id = file._id.toString();

    if (file.parentId) {
      const parent = map[file.parentId.toString()];

      if (parent) {
        parent.children.push(map[id]);
      }
    } else {
      tree.push(map[id]);
    }
  });

  return tree;
};