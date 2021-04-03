# not using this for now
cmake_minimum_required(VERSION 3.19)
project(vasteroids)

# platform agnostic i hope :)
execute_process(COMMAND node -p "require(\"node-addon-api\").include"
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  OUTPUT_VARIABLE NODE_ADDON_API_DIR)

message(WARNING ${CMAKE_TOOLCHAIN_FILE})

string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

add_library(asteroidstest SHARED
cpp/src/AsteroidGenerator.cpp
cpp/src/Asteroid.cpp
cpp/src/Point2D.cpp
${CMAKE_JS_SRC})
target_include_directories(asteroidstest PRIVATE ${CMAKE_JS_INC} ${NODE_ADDON_API_DIR} cpp/include)
set_target_properties(asteroidstest PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(asteroidstest ${CMAKE_JS_LIB})

add_library(collidertest SHARED
cpp/src/AsteroidGenerator.cpp
cpp/src/Asteroid.cpp
cpp/src/AsteroidCollider.cpp
cpp/src/Point2D.cpp
${CMAKE_JS_SRC})

target_include_directories(collidertest PRIVATE ${CMAKE_JS_INC} ${NODE_ADDON_API_DIR} cpp/include)
set_target_properties(collidertest PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(collidertest ${CMAKE_JS_LIB})