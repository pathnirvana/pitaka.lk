import os
import zipfile

folder_list = ['dialog', 'dict', 'fonts', 'images', 'index', 'launcher', 'scripts', 'styles', 'text']
root_file_list = ['index.html', 'converter.html', 'favicon.ico', 'Sarala Sinhala Tipitaka.bat']
version = '6'

def zipdir(path, ziph):
	# ziph is zipfile handle
	for root, dirs, files in os.walk(path):
		for file in files:
			file_name = os.path.join(root, file)
			ziph.write(file_name, arcname=file_name[3:])

if __name__ == '__main__':
	print('creating zip file....')
	zipf = zipfile.ZipFile('PitakaLK Download v' + version + '.zip', 'w', zipfile.ZIP_DEFLATED)
	for folder in folder_list:
		zipdir('../' + folder, zipf)
	for file in root_file_list:
		zipf.write('../' + file, arcname=file)
	zipf.close()
	print('wrote zip file.')
