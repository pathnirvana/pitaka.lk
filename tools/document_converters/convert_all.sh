#!/bin/bash

# You can use either the main.py or this script.

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
    "dhammapada" 
)

output_format=${1}
filter=${2}

for i in "${locations[@]}"
do
    split_file=(${i//// })
    output_file_name=(${split_file[-1]}.${output_format})
    echo "Processing $i -> output file ${output_file_name}"
    bash tools/document_converters/convert.sh $i $output_file_name $output_format $filter
done