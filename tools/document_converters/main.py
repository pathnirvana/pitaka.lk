import pypandoc
import os
from pathlib import Path
import argparse

# Make sure panflute is compatible with this version of pandoc
# download_pandoc(version='2.17.1.1')

input_format = pypandoc.get_pandoc_formats()[1][21] # html
output_format = pypandoc.get_pandoc_formats()[1][0] # 'asciidoc'
input_root_folder = "books"
output_root_folder = "tools/document_converters/output"
filter = "panflute_filter.py"

def files_in_dir(path):
    for entry in os.scandir(path):
        if not entry.name.startswith('.') and entry.is_file() and entry.name.endswith(input_format):
            yield entry.path

def subdirs(path):
    for entry in os.scandir(path):
        if not entry.name.startswith('.') and entry.is_dir():
            yield entry.name
    yield path

def change_ext(filename):
   return filename.replace(input_format, output_format)

def main(input_root_folder=input_root_folder, output_format=output_format):
    for foldername in subdirs(input_root_folder):
        Path(output_root_folder).joinpath(foldername).mkdir(parents=True, exist_ok=True)
        for filename in files_in_dir(f'{foldername}'):
            print(filename)
            pypandoc.convert_file(
                f'{filename}', 
                output_format, 
                outputfile=str(Path(output_root_folder).joinpath(change_ext(filename))),
                # f'{output_root_folder}/{foldername}/{change_ext(filename)}',
                filters=[str(Path(os.path.dirname(__file__)).joinpath("filters").joinpath(filter))]
            )


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description = 'Doc converter CLI')
    parser.add_argument('input_root_folder', help='input root folder relative to the current directory')
    parser.add_argument('output_format', help='which output format to use')
    args = parser.parse_args()

    main(args.input_root_folder, args.output_format)