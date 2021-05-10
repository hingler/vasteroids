// AVL tree which largest element less than entered value

// reordering:

// if a reorder is mandated, we go to the lowest element for which the invariant fails, rotate it, and then bubble up.



#ifndef BIOME_TREE_H_
#define BIOME_TREE_H_

#include <cinttypes>
#include <memory>

namespace vasteroids {

/**
 *  AVL tree which returns the largest stored element which is less than the requested value.
 *  Used to randomly assign asteroids to biomes.
 *  @param U - key type
 *  @param V - value type
 */ 
template <typename U, typename V>
class BiomeTree {
 public:
  /**
   *  Constructs a new BiomeTree.
   */ 
  BiomeTree() {
    root_ = nullptr;
  }

  /**
   *  Insert a new value into this BiomeTree.
   *  @param val - the new value being inserted.
   */ 
  void Insert(U key, V val) {
    // this call should be recursive
    // we send the new value down its respective subtree, or insert and return
    // we need to make lengths consistent here too
    // each node on the bubble up then does its rotation check
    if (root_ == nullptr) {
      root_ = std::make_shared<Node<U, V>>();
      root_->left = nullptr;
      root_->right = nullptr;
    } else {
      InsertRecursive(root_, val);
    }
  }

  /**
   *  Look up the largest stored value which is less than val.
   *  @param val - search query.
   *  @returns pointer to stored value
   */ 
  const V* Lookup(U key) {
    // maintain largest lesser value seen thus far
    // once we hit a null: return the value in that key
    V* max_value = nullptr;

    std::shared_ptr<Node<U, V>> active_node = root_;

    if (active_node == nullptr) {
      // idk what to do really
      // this should never be used though so we'll be OK
      return max_value;
    }

    max_value = active_node->value;

    while (active_node != nullptr) {
      if (key < active_node->key) {
        active_node = active_node->left;
      } else {
        // our key is greater than some found value.
        // as we descend, each time we go right we'll have a value closer to the key than the prior.
        // simply store this value and then move on.
        max_value = &active_node->value;
        active_node = active_node->right;
      }
    }

    return max_value;
  }
  
 private:

  // recursive insert method.
  // returns new root.
  std::shared_ptr<Node<U, V>> InsertRecursive(std::shared_ptr<Node<U, V>> root, U key, V val) {
    if (root == nullptr) {
      std::shared_ptr<Node<U, V>> res = std::make_shared<Node<U, V>>();
      res->key = key;
      res->val = val;
      res->left = res->right = nullptr;
      res->height = 0;
      return res;
    }

    // check left/right
    if (key < root->val) {
      root->left = InsertRecursive(root->left, key, val);
    } else {
      root->right = InsertRecursive(root->right, key, val);
    }
    // call insertrecursive with root as respective side
    // assign myself to result
    // fix height
    root->height = std::max(GetHeight(root->left), GetHeight(root->right)) + 1;


    // then rotate if necessary.
    return TryRotate(root);
  }
  // properly rotates the tree about `root`.
  // @param root - the root we wish to rotate.
  // @returns the new root of the passed subtree.
  std::shared_ptr<Node<U, V>> TryRotate(std::shared_ptr<Node<U, V>> root) {
    int32_t height_l, height_r;
    height_l = GetHeight(root->left);
    height_r = GetHeight(root->right);

    if (std::abs(height_l - height_r) > 1) {
      if (height_l > height_r) {
        if (root->left->right == nullptr) {
          // single right rotation wrt root
          return RotateRight(root);
        } else {
          // left must be null
          root->left = RotateLeft(root->left);
          // simple right
          return RotateRight(root);
        }
      } else {
        if (root->right->left == nullptr) {
          return RotateLeft(root);
        } else {
          root->right = RotateRight(root->right);
          return RotateLeft(root);
        }
      }
    }
  }

  // long/short
  // if long is left/left or right/right: we rotate in the opp direction about the root
  // if long is left/right or right/left: we rotate the direct long child first, and then rotate the root (opp direction for each)

  // handles left/right single rotations.
  std::shared_ptr<Node<U, V>> RotateRight(std::shared_ptr<Node<U, V>> root) {
    std::shared_ptr<Node<U, V>> left, right;
    left = root->left;
    root->left = nullptr;
    left->right = root;

    // fix height
    root->height = GetHeight(root->right) + 1;
    left->height = std::max(GetHeight(root->height), GetHeight(left->left)) + 1;
    return left;
  }

  std::shared_ptr<Node<U, V>> RotateLeft(std::shared_ptr<Node<U, V>> root) {
    std::shared_ptr<Node<U, V>> left, right;
    right = root->right;
    root->right = nullptr;
    right->left = root;

    // fix height
    root->height = GetHeight(root->left) + 1;
    right->height = std::max(GetHeight(root->height), GetHeight(right->right)) + 1;
    return right;
  }

  int32_t GetHeight(std::shared_ptr<Node<U, V>> root) {
    if (root == nullptr) {
      return -1;
    }

    return root->height;
  }

  std::shared_ptr<Node<U, V>> root_;
};

template <typename Key, typename Val>
struct Node {
  std::shared_ptr<Node<Key, Val>> left;
  std::shared_ptr<Node<Key, Val>> right;

  // V is probably very small, just store it plain
  Key key;
  Val val;

  // cache last known height so we don't have to look it up again
  int32_t height;
};

}

#endif