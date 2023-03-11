<?php

$dbServername = "localhost";
$dbUsername = "root"; // Xamp default
$dbPassword = "G%83wViog6b1"; // LastPass LOCAL
$dbName = "dummy_recipe"; // LOCAL



// $dbServername = "localhost";
// $dbPassword = "UEgn7R5m^25x";
// $dbUsername = "sandbox1_ADMIN";
// $dbName = "sandbox1_cookbook";

$conn = mysqli_connect($dbServername, $dbUsername, $dbPassword, $dbName);
?>