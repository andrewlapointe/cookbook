<?php
    include 'nav.php';
    include 'includes/dbh.inc.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/styles.css">
    <title>Dummy Recipes</title>
</head>
<body>
<?php
    $sql = "SELECT * FROM recipe;";
    $results = mysqli_query($conn, $sql);
    $resultCheck = mysqli_num_rows($results);

    if ($resultCheck > 0) {
        while ($row = mysqli_fetch_assoc($results)) {
            echo "<h1 class='blue'> {$row["recipe_name"]} </h1>";
            echo "<p class=''> {$row["recipe_txt"]} </p>";
        }
    }
?>
    
</body>
</html>
