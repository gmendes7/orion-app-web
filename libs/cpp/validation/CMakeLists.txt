cmake_minimum_required(VERSION 3.10)
project(orion_cpp_validation LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)

find_package(PkgConfig REQUIRED)
pkg_check_modules(SODIUM REQUIRED libsodium)

include_directories(${SODIUM_INCLUDE_DIRS})
link_directories(${SODIUM_LIBRARY_DIRS})

# Build a static library from the validation sources. The file `verify.cpp`
# contains the verification function; the `main` used for manual testing is
# guarded by `#ifdef DEMO` so building the library will not require a main.
add_library(validate STATIC verify.cpp)
target_include_directories(validate PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(validate PUBLIC ${SODIUM_LIBRARIES})

# Optionally build a small demo executable which defines DEMO to enable the
# embedded `main` in `verify.cpp`.
option(BUILD_DEMO "Build demo executable for verification" OFF)
if(BUILD_DEMO)
	add_executable(verify_demo verify.cpp)
	target_compile_definitions(verify_demo PRIVATE DEMO)
	target_link_libraries(verify_demo PRIVATE ${SODIUM_LIBRARIES})
endif()

# CLI wrapper: reads message/sig/pubkey from stdin or args and prints result
add_executable(verify_cli verify_cli.cpp)
target_link_libraries(verify_cli PRIVATE validate validate_c)

# C ABI wrapper for easy FFI (loads the same implementation)
add_library(validate_c SHARED c_api.cpp)
target_link_libraries(validate_c PRIVATE validate ${SODIUM_LIBRARIES})
set_target_properties(validate_c PROPERTIES PUBLIC_HEADER c_api.h)

# Optional Python binding using pybind11
option(BUILD_PYBIND11 "Build Python bindings via pybind11" OFF)
if(BUILD_PYBIND11)
	find_package(pybind11 REQUIRED)
	pybind11_add_module(pyvalidate pybind.cpp)
	target_link_libraries(pyvalidate PRIVATE validate)
endif()
