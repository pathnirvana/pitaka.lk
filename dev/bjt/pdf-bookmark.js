// this code should run inside the adobe acrobat js scripts
// create a new action and execute this js code for all files

function addIndex() {
    var bookToParams = {
        'VP1': [1, 2, 23, '01-VP-Parajika Pali'],
        'VP2': [2, 3, 17, '02-VP-Pacittiya Pali 1'],
        'VP3': [3, 3, 31, '03-VP-Pacittiya Pali 2'],
        'VP4': [4, 2, 83, '04-VP-Mahavagga Pali 1'],
        'VP5': [5, 2, -509, '05-VP-Mahavagga Pali 2'],
        'VP6': [6, 2, 15, '06-VP-Chullavagga Pali 1'],
        'VP7': [7, 2, 23, '07-VP-Chullavagga Pali 2'],
        'VP8': [8, 2, 19, '08-VP-Parivara Pali 1'],
        'VP9': [9, 2, 11, '09-VP-Parivara Pali 2'],

        'DN1': [10, 3, 13, '10-DN-Digha Nikaya 1'],
        'DN2': [11, 3, 13, '11-DN-Digha Nikaya 2'],
        'DN3': [12, 3, 19, '12-DN-Digha Nikaya 3'],
        
        'MN1': [13, 3, 17, '13-MN-Majjhima Nikaya 1'],
        'MN2': [14, 3, 13, '14-MN-Majjhima Nikaya 2'],
        'MN3': [15, 3, 13, '15-MN-Majjhima Nikaya 3'],
        
        'SN1': [16, 3, 25, '16-SN-Samyutta Nikaya 1'],
        'SN2': [17, 3, 19, '17-SN-Samyutta Nikaya 2'],
        'SN3': [18, 3, 25, '18-SN-Samyutta Nikaya 3'],
        'SN4': [19, 3, 25, '19-SN-Samyutta Nikaya 4'],
        'SN5': [20, 3, 27, '20-SN-Samyutta Nikaya 5-1'],
        'SN6': [21, 3, 23, '21-SN-Samyutta Nikaya 5-2'],

        'AN1': [22, 2, 37, '22-AN-Anguttara Nikaya 1'],
        'AN2': [23, 2, 19, '23-AN-Anguttara Nikaya 2'],
        'AN3': [24, 2, 19, '24-AN-Anguttara Nikaya 3'],
        'AN4': [25, 2, 17, '25-AN-Anguttara Nikaya 4'],
        'AN5': [26, 2, 21, '26-AN-Anguttara Nikaya 5'],
        'AN6': [27, 2, 27, '27-AN-Anguttara Nikaya 6'],

        'KN1': [28, 2, 27, '28-KN-Khuddakapatha Dhammapada Udana Itivuttaka'],
        'KN2': [29, 2, 21, '29-KN-Suttanipato'],
        'KN3': [30, 2, 27, '30-KN-Vimanavatthu Petavatthu'],
        'KN4': [31, 2, 33, '31-KN-Theragatha'],
        'KN5': [32, 2, 29, '32-KN-Jataka Pali 1'],
        'KN6': [33, 2, 13, '33-KN-Jataka Pali 2'],
        'KN7': [34, 2, 21, '34-KN-Jataka Pali 3'],
        'KN8': [35, 2, 23, '35-KN-Mahaniddesa Pali'],
        'KN9': [36, 2, 17, '36-KN-Cullaniddesa Pali'],
        'KN10': [37, 2, 21, '37-KN-Patisambhidamaggappakarana 1'],
        'KN11': [38, 2, 11, '38-KN-Patisambhidamaggappakarana 2'],
        'KN12': [39, 2, 27, '39-KN-Apadana Thera Apadana 1'],
        'KN13': [40, 2, 17, '40-KN-Apadana Thera Apadana 2'],
        'KN14': [41, 2, 13, '41-KN-Apadana Theri Apadana'],
        'KN15': [42, 2, 25, '42-KN-Buddhavamsa Chariyapitaka Pali'],
        'KN16': [43, 2, 17, '43-KN-Nettippakarana'],
        'KN17': [44, 2, 21, '44-KN-Petakopadeso'],
    };
    // key is based on the original filename
    var key = this.documentFileName.split('.')[0].split('-')[0]; // remove extention
    var bookNum = bookToParams[key][0];
    var minLevel = bookToParams[key][1];
    var pageOffset = bookToParams[key][2];
    var fileName = bookToParams[key][3];

    // adding the bookmarks
    var oStream = util.readFileIntoStream("/E/BJT Scans/pdf-bookmarks.json");
    var strJSON = util.stringFromStream(oStream);
    var searchIndex = eval("(" + strJSON + ")");

    var addedBmks = {}, addedCount = 0;
    this.bookmarkRoot.remove();
    for (var i = 0; i < searchIndex.length; i++) {
        if (searchIndex[i][0] != bookNum || searchIndex[i][4] < minLevel) {
            continue;
        }
        var parentIndex = searchIndex[i][2], isTopLevel = searchIndex[i][4] == minLevel;
        var parent = isTopLevel ? this.bookmarkRoot : addedBmks[parentIndex];

        var pageNum = searchIndex[i][3] + pageOffset;
        var numChilden = parent.children ? parent.children.length : 0;
        parent.createChild(searchIndex[i][1], "pageNum=" + pageNum, numChilden);
        var added = addedBmks[searchIndex[i][5]] = parent.children[numChilden];
        
        var blueRatio = Math.max(0, 0.8 - (searchIndex[i][4] - minLevel) * 0.3); // 0.8, 0.5, 0.2, 0, 0 etc
        added.color = [ "RGB", 0, 0, blueRatio ];
        addedCount++;
    }
    for (var index in addedBmks) {
        addedBmks[index].open = false; // should be done after all children added
        if (addedBmks[index].children) {
            addedBmks[index].style = 2; //bold
        } else {
            addedBmks[index].color = color.black;
        }
    }

    // setting info fields
    this.info.Title = this.info.Subject = fileName;
    this.info.Author = this.info.Creator = this.info.Producer = 'Scanned and PDF prepared by Janaka (Path Nirvana) path.nirvana@gmail.com';
    // this.layout = 'TwoColumnLeft'; // this setting is not sticky - resets when file reopened

    /* Applying a Security Policy to a PDF Document */ 
    /* You need to create a security policy before running this script */ 
    /* Use "Protect > Encrypt > Manage Security Policies" tool */ 
    var ApplySecurity = app.trustedFunction(function() { 
        var oMyPolicy = null; 
        var sPolicyName = "BJT new scans"; // created beforehand
        app.beginPriv(); 
        
        // First, Get the ID of SimplePassword security policy 
        var aPols = security.getSecurityPolicies(); 
        for(var i=0; i<aPols.length; i++) { 
            if(aPols[i].name == sPolicyName) { 
                oMyPolicy = aPols[i]; 
                break;
            } 
        } 
        
        if(oMyPolicy != null) { 
            // Now, Apply the security Policy 
            var rtn = this.encryptUsingPolicy({oPolicy: oMyPolicy });
            if(rtn.errorCode != 0) {
                // Print error message into JavaScript Debugger Console 
                console.println("Security Error: " + rtn.errorText); 
            } 
        }
        app.endPriv(); 
    });
    
    ApplySecurity();

    // save the file
    var pathParts = this.path.split("/"); // Split Path into an array so it is easy to work with
    pathParts.pop(); // Remove old file name
    pathParts.push('final/'+ fileName +'.pdf'); // Add new file name
    this.saveAs(pathParts.join("/")); // Put path back together and save

    return 'Book ' + bookNum + ': Created ' + addedCount + ' bookmarks.';
}

addIndex();
