<?php
include 'hash_lib.php';

$fileName = $_POST["file_name"];
$password = $_POST["password"];
$contents = $_POST["file_contents"];

if (empty($fileName) || empty($contents)) {
    echo "empty filename or contents";
    http_response_code(400);
    exit();
}

$file_extension = end(explode('.', $fileName)); //substr($fileName, -3);
if ($file_extension != "xml" && $file_extension != "txt" && $file_extension != "json") {
    echo "Access denied : File extension";
    http_response_code(401);
    exit();
}

$check_status = checkHash($password, $fileName);
if ($check_status != "SUCCESS") {
    echo "Access denied : $check_status";
    http_response_code(401);
    exit();
}

if (!$handle = fopen($fileName, 'w')) {
     echo "cannot open file ($fileName)";
     http_response_code(400);
     exit();
}

if (fwrite($handle, $contents) === FALSE) {
    echo "cannot write to file ($fileName)";
    http_response_code(400);
    exit();
}

// You're done
fclose($handle);

echo "success";
?>