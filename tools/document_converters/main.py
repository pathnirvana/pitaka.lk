import pypandoc
import os
from pathlib import Path
import argparse

# You can use either the convert_all.sh or this file.
# Make sure panflute is compatible with this version of pandoc
# download_pandoc(version='2.17.1.1')

input_format = 'html'
output_format = 'epub'
output_root_folder = str(Path("tools").joinpath("document_converters").joinpath("output"))
# default_filter = "panflute_filter.py"

def files_in_dir(path, format, exclude_files):
    for entry in os.scandir(path):
        if not entry.name.startswith('.') and entry.is_file() and entry.name.endswith(format) and entry.name not in exclude_files:
            yield entry.path

def subdirs(path, exclude_folders):
    for entry in os.scandir(path):
        if not entry.name.startswith('.') and entry.is_dir() and entry.name not in exclude_folders:
            yield entry.path
    yield path

def change_ext(filename, from_format, to_format):
   return filename.replace(from_format, to_format)

def convert_folder(
    folder,
    output_format,
    input_format,
    output_folder,
    filters,
    exclude_files,
    exclude_folders,
):
    for foldername in subdirs(folder, exclude_folders):
        for filename in files_in_dir(foldername, input_format, exclude_files):
            convert_file(
                filename,
                output_format,
                input_format,
                output_folder,
                filters,
            )

def convert_file(
    file,
    output_format,
    input_format,
    output_folder,
    filters,
):
    output_file = Path(output_folder).joinpath(change_ext(file, input_format, output_format))
    output_file.parent.mkdir(parents=True, exist_ok=True)
    filters = [str(Path(os.path.dirname(__file__)).joinpath("filters").joinpath(filter)) for filter in filters] if filters else []
    pypandoc.convert_file(
        file, 
        output_format, 
        outputfile=str(output_file),
        filters=filters
    )

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description = 'Doc converter CLI')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-r', '--folder', help='input folder relative to the project directory')
    group.add_argument('-f', '--file', help='input file relative to the project directory')
    parser.add_argument('-t', '--output_format', default=output_format, help='which output format to use')
    parser.add_argument('-i', '--input_format', default=input_format, help='which input format to use')
    parser.add_argument('-o', '--output_folder', default=output_root_folder, help='which output folder to use')
    parser.add_argument('-p', '--filters', nargs='*', help='list of filters in the filters folder should be applied [with ext: .py]')
    parser.add_argument('-e', '--exclude_files', nargs='*', default=[], help='list of files to exclude')
    parser.add_argument('-x', '--exclude_folders', nargs='*', default=[], help='list of folders to exclude')

    args = parser.parse_args()

    if args.file:
        convert_file(
            args.file, 
            args.output_format,
            args.input_format,
            args.output_folder,
            args.filters,
        )
    else:
        convert_folder(
            args.folder, 
            args.output_format,
            args.input_format,
            args.output_folder,
            args.filters,
            args.exclude_files,
            args.exclude_folders,
        )