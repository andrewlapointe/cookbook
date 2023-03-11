<?php
    include 'includes/dbh.inc.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/styles.css">
    <title>All Recipes</title>
</head>

<body>
    <?php
        include 'nav.php';
    ?>
    <main id="recipe-main">
        <div class="content">
            <div>
                <img src="images/th-928319788" alt="food image">
            </div>
            <div>
                <h1>Recipe Title</h1>
                <ul>
                    <li>Dummy Ingredient</li>
                    <li>Dummy Ingredient</li>
                    <li>Dummy Ingredient</li>
                    <li>Dummy Ingredient</li>
                    <li>Dummy Ingredient</li>
                    <li>Dummy Ingredient</li>
                    <li>Dummy Ingredient</li>
                </ul>
            </div>
            <div id="recipe-text-container">
                <p id="recipe-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </p>
            </div>
        </div>
    </main>
    <?php
        include 'footer.php';
    ?>
</body>

</html>