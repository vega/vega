#!/usr/bin/env bash
# Script to generate typings test cases from valid specifications

rm -rf tests/spec/valid
mkdir tests/spec/valid

for file in ../vega/test/specs-valid/*.json
do
  name=${file##*/}
  base=${name%.vg.json}
  content=$(<$file)
  output=tests/spec/valid/$base.ts

  echo "Creating $output"

  printf "import { Spec } from 'vega';\n\n" > "$output"
  printf "export const spec: Spec = " >> "$output"
  cat $file | perl -pe 'chomp if eof' >> "$output"
  printf ";\n" >> "$output"
done
