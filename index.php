<?php
    include_once 'includes/dbh.inc.php';
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

<body>
    <?php
        include 'nav.php';
    ?>
    <main id="main-home">
        <div class="banner">
            <img src="images/spoon3.png" alt="spoon banner">
            <div class="break"></div>
            <h1>The <span class="italic">Last</span> Cookbook You'll Ever Need.</h1>
        </div>
        <div class="break"></div>
        <div id="sample-container">
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/th-928319788" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Sample Recipe</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/th-928319788" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Sample Recipe</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/th-928319788" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Sample Recipe</h3>
            </div>
        </div>
    </main>
    <?php
        include 'footer.php';
    ?>
</body>


<!-- HIDDEN -->
<div style="visibility: hidden;">
    <?php
    echo 'PHP version: ' . phpversion();
    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
      }
      echo "Connected successfully";
    ?>
</div>
<!-- HIDDEN -->

</html>