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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
        rel="stylesheet">
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <title>LaPointe Cooking Compendium</title>
</head>

<body>
    <header>
        <div class="navbar" style="z-index: 10">
            <!-- MADE HIDDEN  -->
            <div style="visibility: hidden;" class="flex-item" id="logo">
                <a href="index.php"><img src="images\cook_book_logo.png" alt="cookbook logo"></a>
            </div>
            <div class="flex-item shade tab">
                <a href="index.php">Home</a>
            </div>
            <div class="flex-item shade tab">
                <a href="all-recipes.php">All Recipes</a>
            </div>
            <div class="flex-item shade tab">
                <a href="recipe.php">Recipe</a>
            </div>
            <div class="flex-item shade tab">
                <a href="insert.php">Insert</a>
            </div>
            <div class="flex-item shade tab" style="display:flex; justify-self: center;">
                <a href="contact.php" target="_blank">Contact Us</a>
            </div>
            <div class="search-container flex-item shade tab">
                <form action="/search" method="get">
                    <input class="search expandright" id="searchleft" type="search" name="q" placeholder="     Search">
                    <label class="button searchbutton" for="searchleft">
                        <a class="mglass material-symbols-outlined">
                            search
                        </a>
                    </label>
                </form>
            </div>

        </div>
    </header>