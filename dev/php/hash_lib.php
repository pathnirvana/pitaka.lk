<?php

$super_secret = 'janaka-super';
$extra_salt = 'FsdHDUP:L*#>@$!.,hfjs';
$hash_length = 10;
$hash_algo = 'ripemd160';

function checkHash($hash, $file_path) {
    if ($hash == $GLOBALS['super_secret']) { // for saving special content from dev scripts
        return "SUCCESS";
    }
    $hash_parts = explode(':', $hash);
    $full_hash = hash($GLOBALS['hash_algo'], $hash_parts[0] . $GLOBALS['super_secret'] . $GLOBALS['extra_salt']);
    // check hash
    if ($hash_parts[1] != substr($full_hash, 0, $GLOBALS['hash_length'])) {
        return "BAD HASH";
    }
    $param_parts = explode('-', $hash_parts[0]);
    $file_parts = explode('/', $file_path);
    if (count($param_parts) != 3 || count($file_parts) < 3) {
        return "BAD PARAM";
    }
    // check file name
    $file_name = $file_parts[count($file_parts) - 1];
    if (strpos($file_name, 'vagga_' . $param_parts[0]) !== 0) { // starts with node id, e.g. 18 would match any vagga inside book 18
        return "UNAUTH VAGGA";
    }
    // check column
    $coll = substr($file_parts[count($file_parts) - 2], 5);
    if ($coll != $param_parts[1]) {
        return "UNAUTH COLLECTION";
    }
    // check expired
    $date_parts = explode('/', $param_parts[2]);
    if (count($date_parts) != 3) {
        return "BAD PARAM";
    }
    $param_time = mktime(0, 0, 0, $date_parts[1], $date_parts[2], $date_parts[0]) + 24 * 60 * 60; // add one day
    if ($param_time < time()) { // expired
        return "EXPIRED";
    }
    return "SUCCESS";
}

function getHash($node, $coll, $date) {
    if (!$date) { // if empty default to two week from now
        $nextWeek = time() + (14 * 24 * 60 * 60);
        $date = date('Y/m/d', $nextWeek);
    }
    $param = $node . '-' . $coll . '-' . $date;
    $full_hash = hash($GLOBALS['hash_algo'], $param . $GLOBALS['super_secret'] . $GLOBALS['extra_salt']);
    return $param . ':' . substr($full_hash, 0, $GLOBALS['hash_length']);
}

function print_checkHash($hash, $file_path) {
    print "Hash = $hash,  FilePath = $file_path,  Check = " . checkHash($hash, $file_path) . "<br>";
}

function testHash() {
    $hash = getHash(18, 'aps', '');
    echo print_checkHash($hash, 'text/sinh-aps/vagga_1810.xml'); // true
    echo print_checkHash($hash, 'text/sinh-aps/vagga_18.xml'); // true
    echo print_checkHash($hash, 'text/sinh-aps/vagga_1910.xml'); // false node error
    echo print_checkHash($hash, 'text/sinh-kk/vagga_1810.xml'); // false coll error
    echo print_checkHash($hash, 'vagga_1810.xml'); // false

    $hash = getHash(18, 'aps', '2013/01/01'); // old hash
    echo print_checkHash($hash, 'text/sinh-aps/vagga_1810.xml'); // false expired

    echo print_checkHash('badhash', 'text/sinh-aps/vagga_1810.xml'); // false bad hash
    echo print_checkHash('18-aps-2017/01/17:94064a73c0', 'text/sinh-aps/vagga_1810.xml'); // false bad hash
}

//testHash();
?>