#include <server/BiomeTree.hpp>

#include <napitest.hpp>

#include <napi.h>

using namespace vasteroids;
using server::BiomeTree;

void InsertTest(Napi::Env);
void LookupTest(Napi::Env);

void RunTest(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  InsertTest(env);
  LookupTest(env);
}

void InsertTest(Napi::Env env) {
  BiomeTree<float, int> tree;
  tree.Insert(1.0f, 1);
  tree.Insert(2.0f, 2);
  tree.Insert(3.0f, 3);
  tree.Insert(4.0f, 4);

  int val;
  ASSERT_T(tree.Lookup(1.1f, &val), env);
  ASSERT_E(1, val, env);
  std::cout << "insert test passed!" << std::endl;
}

void LookupTest(Napi::Env env) {
  BiomeTree<float, int> tree;
  tree.Insert(1.0f, 1);
  tree.Insert(2.0f, 2);
  tree.Insert(3.0f, 3);
  tree.Insert(-1.0f, 4);
  tree.Insert(1.5f, 5);

  int val;
  ASSERT_T(!tree.Lookup(-15.0f, &val), env);
  ASSERT_T(tree.Lookup(1.1f, &val), env);
  ASSERT_E(val, 1);

  ASSERT_T(tree.Lookup(3.2f, &val), env);
  ASSERT_E(val, 3);
  
  ASSERT_T(tree.Lookup(0.0f, &val), env);
  ASSERT_E(val, 4, env);

  ASSERT_T(tree.Lookup(16.0f, &val), env);
  ASSERT_E(val, 3, env);

  ASSERT_T(tree.Lookup(2.6f, &val), env);
  ASSERT_E(val, 2, env);
  
  ASSERT_T(tree.Lookup(1.8f, &val), env);
  ASSERT_E(val, 5, env);
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("RUNBIOMETEST", Napi::Function::New(env, RunTest));
  return exports;
}

NODE_API_MODULE(biometest, Init);

