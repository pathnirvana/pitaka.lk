#! /bin/bash

echo "Converting $1 -> $2"
root_dir=$1
output_file=$2
output_format=$3
filter=$4
files=$(find $root_dir -iname "*.html" -type f | sort --version-sort --field-separator=- | tr '\n' ' ')
pandoc -f html -t ${output_format} -s ${files} -o tools/document_converters/output/$output_file -F tools/document_converters/filters/${filter}.py --toc
