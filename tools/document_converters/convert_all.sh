#! /bin/bash

locations=( 
    "books/abhidharma-chandrikava"
    "books/abhidharma-margaya"
    "books/abhidharmaye-mulika-karunu"
    "books/atuwakathawasthu"
    "books/atuwa-tika-pali"
    "books/bauddhayage-athpotha"
    "books/bodhi-pakshika-dharma"
    "books/bodhi-poojawa"
    "books/buddha-charithaya"
    "books/chaththalisakara-vipassana"
    "books/chathurarya-sathya"
    "books/dharma-winishchaya"
    "books/karma-vipaka"
    "books/keles-1500"
    "books/milinda-prashnaya"
    "books/palibhashavatharanaya-1"
    "books/paramitha-prakaranaya"
    "books/patichcha-samuppada-vivaranaya"
    "books/pohoya-dinaya"
    "books/pohoya-varnanava"
    "books/punyopadeshaya"
    "books/rasawahini"
    "books/satipattana-vipassana"
    "books/shasanavatharanaya"
    "books/sihala-vaththu"
    "books/suvisi-gunaya"
    "books/ubhaya-prathimokshaya"
    "books/upasampada-sheelaya"
    "books/vidarshana-bhavana-kramaya"
    "books/vishuddhi-margaya"
    "books/wanchaka-dharma"
)

output_format=${1:-'asciidoc'}
filter=${2:-'panflute_filter'}

for i in "${locations[@]}"
do
    split_file=(${i//// })
    output_file_name=(${split_file[1]}.${output_format})
    echo "Processing $i -> output file ${output_file_name}"
    sh tools/document_converters/convert.sh $i $output_file_name $output_format $filter
done