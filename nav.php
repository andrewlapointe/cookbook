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
    <title>LaPointe Cooking Compendium</title>
</head>

<body>
    <header>
        <div class="navbar" style="z-index: 10">
            <div class="flex-item" id="logo">
                <a href="index.php">Mom's Cookbook</a>
            </div>
            <div class="flex-item shade">
                <a href="all-recipes.php">All Recipes</a>
            </div>
            <div class="flex-item shade">
                <a href="recipe.php">Recipe</a>
            </div>
            <div class="flex-item shade">
                <a href="insert.php">Insert</a>
            </div>
            <div class="flex-item">
                <input type="text" placeholder="Search.."> <!-- Search Bar #TODO -->
            </div>
            <div class="flex-item shade">
                <a href="https://www.google.com/imgres?imgurl=https%3A%2F%2Ffreight.cargo.site%2Fw%2F500%2Fi%2Fb334a88e29d8d253a49bc3baf614e909913c7aaf1d65b5f7d963aae0fbb267ec%2FSuggestionBox-gif.gif&imgrefurl=https%3A%2F%2Fnew-studio.us%2FSuggestion-Box&tbnid=_djT_DRHFfoOmM&vet=12ahUKEwj0xoSr9tT9AhVeOkQIHT_QAZsQMygAegUIARDcAQ..i&docid=sSdJrAIqxrQ9FM&w=500&h=500&q=suggestion%20box%20shredder%20gif&ved=2ahUKEwj0xoSr9tT9AhVeOkQIHT_QAZsQMygAegUIARDcAQ"
                    target="_blank">Contact Us</a>
            </div>
        </div>
    </header>