<?php
include 'hash_lib.php';

$node = $_GET['node'];
$coll = $_GET['coll'];
$date = $_GET['date'];

if ($node != '' && $coll != '') {
    $hash = getHash($node, $coll, $date);
    echo "http://pitaka.lk/?editing=$hash";
}
?>