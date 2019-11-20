//*****************************************************************************
// This script implements the famous Trie algoritm for fast dictionary lookup.
//
// Usage: 
//	var trie = new Trie();
//	trie.add("apple", 1);
//	trie.add("application", 2);
//	trie.add("aparent", 3);
//	trie.add("bat", 4);
//	var node = trie.search("ap");
//	var resultLimit = 100;
//	var result = [];
//	collect(node, resultLimit, result);
//
// Result vector will be [1, 2, 3]
//
//*****************************************************************************

// Trie data structure is for fast dictionary lookup
function Trie() {
	this.head = {
		key : '', 
		children: {},
		entryCount:0 // Total enries in the tree
	}
}

Trie.prototype.add = function(key, index) {

	var curNode = this.head;
	var newNode = null;
	var curChar = key.charAt(0);

	key = key.slice(1);
	this.entryCount++;
	
	while(typeof curNode.children[curChar] !== "undefined" && curChar.length > 0){
		curNode = curNode.children[curChar];
		curChar = key.charAt(0);
		key = key.slice(1);
		curNode.entryCount++;
	}

	while(curChar.length > 0) {
		newNode = {
			key : curChar,
			index : key.length === 0 ? index : undefined,
			children : {},
			entryCount:1 // Total enries in the sub tree
		};

		curNode.children[curChar] = newNode;
		curNode = newNode;
		curChar = key.charAt(0);
		key = key.slice(1);
	}
};

// Returns the node. or null if not found.
Trie.prototype.search = function(key) {
	var curNode = this.head;

	while(key.length > 0){
		var curChar = key.charAt(0);
		curNode = curNode.children[curChar];
		if (typeof curNode === "undefined")
			return null;	
		
		key = key.slice(1);
		
		if (key.length === 0)
			return curNode;
	}

	return null;
};

// Recursively collect at least count number of values from the Trie node
function collect(node, count, result) {	
	if (typeof node.index !== "undefined") {
		result.push(node.index);
		count--;
		if (count == 0)
			return true;
	}
	
	for (var n in node.children) {
		var child = node.children[n];
		if (collect(child, count, result))
			return true;
	}

	return false;
}
