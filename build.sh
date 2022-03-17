#!/usr/bin/env bash

#CC="musl/bin/x86_64-linux-musl-gcc -static"
CC=gcc
SOURCE_DIR=src
OUTPUT_DIR=bin
CFLAGS="-I ./compiler/include -I ./src/substratic/src/spng/ -I ./src/substratic/src/cglm/ -I ./src/substratic/src/glad/include $(pkg-config --cflags glfw3)"
LIBS="-lm $(pkg-config --libs glfw3) $(pkg-config --libs gl) -ldl -lz"
DEBUG_FLAGS="-O0 -g -ggdb -DDEBUG -fsanitize=address"

# Yes, I know I could just use a Makefile.  This script is for bootstrapping purposes.

# Ensure that the compiler library is cloned
if [ ! -d "./compiler" ]; then
  echo -e "Cloning Mesche Compiler repo...\n"
  git clone https://github.com/mesche-lang/compiler compiler
fi

# Also pull down musl-c
if [ ! -d "./musl" ]; then
  echo -e "Installing musl-c locally...\n"
  # Clean up anything that's still sitting around
  rm -f musl.tar.gz
  rm -rf tmp

  # Download the latest package into a tmp folder and unpack it
  mkdir -p tmp
  wget https://musl.cc/x86_64-linux-musl-native.tgz -O tmp/musl.tar.gz
  tar -zxvf tmp/musl.tar.gz -C tmp

  # Move the files into a predictable location
  mv tmp/x86_64* ./musl
  rm -rf tmp
fi

# Build the compiler
#LCC="$(pwd)/$CC"
cd ./compiler
CC=$CC ./build.sh
[ $? -eq 1 ] && exit 1
cd ..

# Build the CLI
source_files=(
    "main.c"
    "substratic/src/log.c"
    "substratic/src/file.c"
    "substratic/src/renderer.c"
    "substratic/src/shader.c"
    "substratic/src/texture.c"
    "substratic/src/window.c"
    "substratic/src/glad/src/glad.c"
    "substratic/src/spng/spng.c"
)

object_files=()

if [ ! -d "./bin" ]; then
    mkdir ./bin
fi

# Build any changed source files
for i in "${source_files[@]}"
do
    input_file="$SOURCE_DIR/$i"
    output_file="$OUTPUT_DIR/${i%.c}.o"
    object_files+=("$output_file")

    if [[ $input_file -nt $output_file ]]; then
        echo "Compiling $i..."
        mkdir -p `dirname "$OUTPUT_DIR/${i}"`
        $CC -c $DEBUG_FLAGS "$SOURCE_DIR/$i" -o "$OUTPUT_DIR/${i%.c}.o" $CFLAGS
        [ $? -eq 1 ] && exit 1
    else
        echo "Skipping $i, it is up to date."
    fi
done

# Build the CLI program
echo -e "\nCreating Crash The Stack bin/crash-the-stack..."
$CC -o bin/crash-the-stack "${object_files[@]}" ./compiler/bin/libmesche.a $LIBS $DEBUG_FLAGS
[ $? -eq 1 ] && exit 1
chmod +x bin/crash-the-stack

echo -e "\nDone!\n"
