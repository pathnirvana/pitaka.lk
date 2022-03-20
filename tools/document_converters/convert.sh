#! /bin/bash

# Ex: ./tools/document_converters/convert.sh books/abhidharma-chandrikava abhi.asciidoc asciidoc panflute_filter
root_dir=${1}
output_file=${2}
output_format=${3}
filter=${4}
echo "Converting $root_dir -> $output_file"
# find files with the given extension and sort them by number in the filename
# Pipe to `tr`` for arranging them in space seperated string
files=$(find $root_dir -iname "*.html" -type f | sort --version-sort --field-separator=- | tr '\n' ' ')
pandoc -f html -t ${output_format} -s ${files} -o tools/document_converters/output/$output_file -F tools/document_converters/filters/${filter}.py --toc
