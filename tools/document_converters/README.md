# Document Converter

- This project uses [pandoc](https://pandoc.org) to convert documents to various formats.

> Pandoc is structured as a set of readers, which translate various input formats into an abstract syntax tree (the Pandoc AST) representing a structured document, and a set of writers, which render this AST into various output formats. Pictorially:
>
>[input format] ==reader==> [Pandoc AST] ==writer==> [output format] [1]

[1]: https://pandoc.org/using-the-pandoc-api.html#pandocs-architecture

- This project uses [panflute filters](http://scorreia.com/software/panflute) to edit and modify the pandoc AST before it is rendered.
- Filters have only been tested with `books/abhidharma-chandrikawa` and works well with `epub` output format.

## Requirements

- Python3.9
- Pandoc 2.17.1.1
- pip 20.2.3

```sh
cd /path/to/pitaka.lk
python3.9 -m venv .venv
source .venv/bin/activate
pip install -r tools/document_converters/requirements/requirements.txt
```

## Instructions

- [Install Pandoc 2.17.1.1](https://pandoc.org/installing.html)
- You can use `convert_all.sh` for converting multiple books at once. Locations are specified in the script itself. This will generate one output file per book by combining all the input htmls.

Command format:
```sh
./tools/document_converters/convert_all.sh [output_format] [filter_name]
```
Example usage:

```sh
./tools/document_converters/convert_all.sh asciidoc panflute_filter
```

- Or you can use `convert.sh` for converting a single book. This will also generate one output file by combining all the input htmls.

Command format:
```sh
./tools/document_converters/convert.sh [input_folder] [output_file] [output_format] [filter]
```
Example usage:

```sh
./tools/document_converters/convert.sh books/abhidharma-chandrikava abhidharma-chandrikava.epub epub panflute_filter
```

- Or you can use `main.py` for converting a single book from a folder or converting a single input file. This will generate multiple output files.
- This script is using pypandoc for calling the pandoc engine internally. This is a Python wrapper for the pandoc executable. I couldn't find a way to pass multiple input files to pandoc using pypandoc wrapper. Above shell scripts directly call pandoc. So we can pass multiple input files in the above commands.


Command format:

```sh
python3.9 tools/document_converters/main.py --help
```
```
usage: main.py [-h] (-r FOLDER | -f FILE) [-t OUTPUT_FORMAT] [-i INPUT_FORMAT] [-o OUTPUT_FOLDER] [-p [FILTERS ...]] [-e [EXCLUDE_FILES ...]]
               [-x [EXCLUDE_FOLDERS ...]]

Doc converter CLI

optional arguments:
  -h, --help            show this help message and exit
  -r FOLDER, --folder FOLDER
                        input folder relative to the project directory
  -f FILE, --file FILE  input file relative to the project directory
  -t OUTPUT_FORMAT, --output_format OUTPUT_FORMAT
                        which output format to use
  -i INPUT_FORMAT, --input_format INPUT_FORMAT
                        which input format to use
  -o OUTPUT_FOLDER, --output_folder OUTPUT_FOLDER
                        which output folder to use
  -p [FILTERS ...], --filters [FILTERS ...]
                        list of filters in the filters folder should be applied [with ext: .py]
  -e [EXCLUDE_FILES ...], --exclude_files [EXCLUDE_FILES ...]
                        list of files to exclude
  -x [EXCLUDE_FOLDERS ...], --exclude_folders [EXCLUDE_FOLDERS ...]
                        list of folders to exclude
```
Example usage:
```
python3.9 tools/document_converters/main.py -f books/abhidharma-chandrikava/1.html -p panflute_filter.py
```

## Github Actions

- You can also use the Github Action specified in this project to convert the files listed in the `convert_all.sh` script.