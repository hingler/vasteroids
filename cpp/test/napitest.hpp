#ifndef NAPITEST_H_
#define NAPITEST_H_

#include <cmath>
#include <iostream>

#define ERROR_A2(env, msg) Napi::Error::New(env, msg).ThrowAsJavaScriptException()
#define ERROR_A1(env) Napi::Error::New(env, "").ThrowAsJavaScriptException()

#define PRINTLN(msg) std::cout << msg << std::endl

#define EXPAND(x) x

#define ERR_LOOKUP(_1, _2, NAME, ...) NAME
#define ERROR(...) EXPAND(ERR_LOOKUP(__VA_ARGS__, ERROR_A2, ERROR_A1)(__VA_ARGS__))

#define ASSERT_T_INFO(cond) PRINTLN("\t\033[1;31mERR: expected " << #cond << " to be true\033[0m")
#define ASSERT_T_MSG(cond, env, msg) if (!(cond)) {\
  ASSERT_T_INFO(cond);\
  PRINTLN("\t" << msg);\
  ERROR(env, msg);\
}
#define ASSERT_T_NOMSG(cond, env) if (!(cond)) {\
  ASSERT_T_INFO(cond);\
  ERROR(env);\
}
#define ASSERT_T_LOOKUP(_1, _2, _3, NAME, ...) NAME
#define ASSERT_T(...) EXPAND(ASSERT_T_LOOKUP(__VA_ARGS__, ASSERT_T_MSG, ASSERT_T_NOMSG)(__VA_ARGS__))


#define ASSERT_E_INFO(ex, ac) PRINTLN("\t\033[1;31mERR: expected " << #ex << " (" << ex << ") to equal " << #ac << " (" << ac << ")!\033[0m")
#define ASSERT_E_MSG(ex, ac, env, msg) if (ex != ac) {\
  ASSERT_E_INFO(ex, ac);\
  PRINTLN("\t" << msg);\
  ERROR(env, msg);\
}

#define ASSERT_E_NOMSG(ex, ac, env) if (ex != ac) {\
  ASSERT_E_INFO(ex, ac);\
  ERROR(env);\
}

#define ASSERT_E_LOOKUP(_1, _2, _3, _4, NAME, ...) NAME
#define ASSERT_E(...) EXPAND(ASSERT_E_LOOKUP(__VA_ARGS__, ASSERT_E_MSG, ASSERT_E_NOMSG)(__VA_ARGS__))


#define ASSERT_N_INFO(ex, ac, eps) PRINTLN("\t\033[1;31mERR: expected " << #ex << " (" << ex << ") to be within " << #eps << " (" << eps << ") of " << #ac << "( " << ac << ")!\033[0m")
#define ASSERT_N_MSG(ex, ac, eps, env, msg) if (abs(ex - ac) > eps) {\
  ASSERT_N_INFO(ex, ac, eps);\
  PRINTLN("\t" << msg);\
  ERROR(env, msg);\
}

#define ASSERT_N_NOMSG(ex, ac, eps, env) if (abs(ex - ac) > eps) {\
  ASSERT_N_INFO(ex, ac, eps);\
  ERROR(env);\
}
#define ASSERT_N_LOOKUP(_1, _2, _3, _4, _5, NAME, ...) NAME
#define ASSERT_N(...) EXPAND(ASSERT_N_LOOKUP(__VA_ARGS__, ASSERT_N_MSG, ASSERT_N_NOMSG)(__VA_ARGS__))

#endif