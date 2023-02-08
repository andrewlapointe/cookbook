<?php
    include_once 'includes/dbh.inc.php';
    include 'nav.php';
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/styles.css">
    <title>LaPointe Cooking Compendium</title>
</head>

<body class="home">
    <p>This is a paragraph</p>
    <?php if (1 == 1){ ?>
       <p>Hello World!</p>
    <?php }?>
    <p>This is a paragraph</p>

<div class="insert_form">
<form action="functions.php" method="get">
        <input type="text" name="recipe_name" placeholder="Number 1">
        <input type="text" name="recipe_txt" placeholder="Number 2">
        <button type="submit">Calculate!</button>
    </form>

</div>



    <!-- <iframe width="352" height="626" src="https://www.youtube.com/embed/Y1CIbO3O8-s" title="Powerlifter VS Crossfitter" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe> -->

    <?php
        $sql = "SELECT * FROM recipe;";
        $results = mysqli_query($conn, $sql);
        $resultCheck = mysqli_num_rows($results);

        if ($resultCheck > 0) {
            while ($row = mysqli_fetch_assoc($results)) {
                echo "<p class='blue'> {$row["recipe_name"]} </p>";
            }
        }
    ?>


    <script src="js/test.js"></script>
</body>
</html>