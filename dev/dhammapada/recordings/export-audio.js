const path = require('path'), fs = require('fs'), assert = require('assert')

console.log('running from folder ' + __dirname)

let gathaNumber = 1
for (let vagga = 1; vagga <= 26; vagga++) {
    const vaggaFolder = path.join(__dirname, vagga.toString())
    if (!fs.existsSync(vaggaFolder)) return

    const files = fs.readdirSync(vaggaFolder)
    const mp3Files = files.filter(file => path.extname(file).toLowerCase() === '.mp3')
    console.log(`processing ${mp3Files.length} files in folder ${vaggaFolder} starting from ${gathaNumber}`)

    for (let fileIndex = 1; fileIndex <= mp3Files.length; fileIndex++) {
        const destFile = path.join(__dirname, '../../../dhammapada/recordings', gathaNumber + '.mp3')
        const sourceFile = path.join(vaggaFolder, fileIndex + '.mp3')
        assert(fs.existsSync(sourceFile), `source file ${sourceFile} does not exist in folder ${vaggaFolder}`)
        fs.copyFileSync(sourceFile, destFile)
        gathaNumber++
    }
    // process.exit()
}

console.log('total files processed ' + gathaNumber - 1)
