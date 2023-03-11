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
    <div style="text-align: center;">
        <h1>NOTE FOR VISITORS</h1>
        <p>Please do not use this form. #goodcybersecurity</p>
        <div class="insert_form">
            <form action="functions.php" method="post" id="insert_form_parent" target="_self">
                <ul style="list-style-type: none;">
                    <li>
                        <h2>
                            <label for="recipe_name">Recipe Name:</label>
                        </h2>
                        <br>
                        <input type="text" name="recipe_name" placeholder="Name...">
                    </li>
                    <li>
                        <label for="author">
                            <h2>Author:</h2>
                        </label>
                        <input type="text" name="recipe_name" placeholder="Author...">
                    </li>
                    <li>
                        <label for="recipe_txt">
                            <h2>Recipe Instructions:</h2>
                        </label>
                        <textarea name="recipe_txt" cols="30" rows="10">Instructions...</textarea>
                    </li>
                    <li>
                        <h2>
                            <label for="ingredient">Ingredients:</label>
                        </h2>
                    </li>
                    <li id="ingredient_parent">
                        <input id="ingredient_input" type="text">
                        <br>
                    </li>
                    <li>
                        <button type="button" onclick="addIngredient()">Add Ingredient</button>
                    </li>
                    <br>
                    <li>
                        <button type="submit">Submit</button>
                    </li>
                </ul>
            </form>
        </div>
</body>
<script src="js/form.js"></script>
</div>