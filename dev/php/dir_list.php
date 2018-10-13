<?php
$sourceDir = $_GET["folder"];
$files = join(",", scandir("../$sourceDir"));
echo $files;
?>