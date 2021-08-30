#!/usr/bin/env bash
# Script to generate typings test cases from valid specifications


set -e
set -o pipefail
set -o nounset

rm -rf tests/spec/valid
mkdir tests/spec/valid

rm -rf tests/dataflow
mkdir tests/dataflow

for file in ../vega/test/specs-valid/*.json
do
  name=${file##*/}
  base=${name%.vg.json}
  content=$(<$file)
  output=tests/spec/valid/$base.ts
  outputDataflow=tests/dataflow/$base.ts

  echo "Creating $output"

  printf "import { Spec } from 'vega';\n\n" > "$output"
  printf "export const spec: Spec = " >> "$output"
  cat $file | perl -pe 'chomp if eof' >> "$output"
  printf ";\n" >> "$output"

  echo "Creating $outputDataflow"

  printf "import { Runtime } from 'vega';\n\n" > "$outputDataflow"
  printf "export const dataflow: Runtime = " >> "$outputDataflow"
  ./vega-to-dataflow.js "$file" "$outputDataflow"

done

yarn run format-dataflow-tests
