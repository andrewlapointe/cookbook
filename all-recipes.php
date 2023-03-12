<?php
    include 'nav.php';
?>

<main id="all-recipes-main">
    <div class="content">
        <div class="fork">
            <!-- https://www.rawpixel.com/image/6288328/png-sticker-vintage#eyJrZXlzIjoiZm9yayIsInNvcnRlZEtleXMiOiJmb3JrIn0= -->
            <img src="images/fork.png" alt="fork">
        </div>
        <div class="list-of-recipes">
            <h1>List of all Recipes</h1>
            <ul>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>
                <a href="recipe.php">
                    <li>Dummy Recipe</li>
                </a>

            </ul>
        </div>
    </div>

</main>
<?php
        include 'footer.php';
    ?>

<!-- <?php
    $sql = "SELECT * FROM recipe;";
    $results = mysqli_query($conn, $sql);
    $resultCheck = mysqli_num_rows($results);

    if ($resultCheck > 0) {
        while ($row = mysqli_fetch_assoc($results)) {
            echo "<h1 class='blue'> {$row["recipe_name"]} </h1>";
            echo "<p class=''> {$row["recipe_txt"]} </p>";
        }
    }
?> -->

</body>

</html>