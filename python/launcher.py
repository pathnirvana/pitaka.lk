import SimpleHTTPServer
import SocketServer
import os
import webbrowser
import socket

HOSTNAME = 'localhost'
PORT = 9876

def openPitakaLK():
	#sleep(1)
	webbrowser.open('http://' + HOSTNAME + ':' + str(PORT))

def openPitakaDict():
	webbrowser.open('http://' + HOSTNAME + ':' + str(PORT) + '/dict')

def check_server(address, port):
	s = socket.socket()
	print "Attempting to connect to %s on port %s" % (address, port)
	try:
		s.connect((address, port))
		print "Connected to %s on port %s" % (address, port)
		return True
	except socket.error, e:
		print "Connection to %s on port %s failed: %s" % (address, port, e)
		return False


os.chdir('..')  # set document root to the parent folder - might not be needed in production

running = check_server(HOSTNAME, PORT)
webbrowser.open('http://' + HOSTNAME + ':' + str(PORT))
if not running:
	Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
	httpd = SocketServer.TCPServer((HOSTNAME, PORT), Handler)
	print "serving http server at port", PORT
	httpd.serve_forever()
