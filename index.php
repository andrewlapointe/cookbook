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

<body>
    <div class="home">
        <h1>
            TITLE
        </h1>
        <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet
            dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper
            suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in
            vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et
            accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait
            nulla facilisi.
        </p>
    </div>


    <div class="insert_form">
        <form action="functions.php" method="get">
            <input type="text" name="recipe_name" placeholder="Number 1">
            <input type="text" name="recipe_txt" placeholder="Number 2">
            <button type="submit">Calculate!</button>
        </form>

    </div>



    <!-- <iframe width="352" height="626" src="https://www.youtube.com/embed/Y1CIbO3O8-s" title="Powerlifter VS Crossfitter" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe> -->

    <?php
    
    echo 'PHP version: ' . phpversion();
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