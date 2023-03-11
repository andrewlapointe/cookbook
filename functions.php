<?php
include_once 'includes/dbh.inc.php';


// function insert($recipe_name, $recipe_txt, $conn) {
//     $sql = "INSERT INTO recipe (recipe_name, recipe_txt)
//             VALUES ('$recipe_name', '$recipe_txt')";

//     if (mysqli_query($conn, $sql)) {
//         echo "New record created successfully";
//     } else {
//         echo "Error: " . $sql . "<br>" . mysqli_error($conn);
//     }
// }

// $name = $_GET["recipe_name"];
// $txt = $_GET["recipe_txt"];

// insert($name, $txt, $conn);