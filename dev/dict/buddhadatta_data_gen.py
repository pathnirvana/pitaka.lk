# for converting buddhadatta text file I got from the android app
import codecs

filename = "buddhadatta_input.txt";
fileout = "buddhadatta_data.txt";
fo = codecs.open(fileout, 'w+', encoding='utf8')

class Entry:
    def __init__(self, line):
        parts = line.split('\t')
        if len(parts) != 5 or parts[4] != "P":
            raise NameError(line, " has ", len(parts))
        self.eng = parts[0]
        self.pali = parts[1]
        self.sinhs = [parts[2:-1]]

    def __eq__(self, o):
        return self.eng == o.eng and self.pali == o.pali

    def add(self, o):
        self.sinhs.extend(o.sinhs)

    def getStr(self):
        out = self.pali + "\t" #tab delimited
        pSign = ""
        for sinh in self.sinhs:
            if pSign == sinh[1]:
                out += sinh[0] + "; "
            else:
                out += sinh[1] + " " + sinh[0] + "; "
                pSign = sinh[1]
        return out[:-2] + ".\r\n" #remove ending semicolon and space
            
            
def processLine(line):
    global prev
    cur = Entry(line)
    if cur == prev:
        prev.add(cur)
    else:
        fo.write(prev.getStr())
        prev = cur;


prev = Entry(" \tbuddhadatta\t \t \tP")

with codecs.open(filename, 'r', encoding='utf8') as fi:
    for line in fi:
        processLine(line.rstrip())

fo.write(prev.getStr())
fo.close()
