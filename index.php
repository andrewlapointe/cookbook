<?php
    include 'nav.php';
?>

<main id="main-home">
    <div class="banner">
        <img src="images/spoon3.png" alt="spoon banner">
        <div class="break"></div>
        <!-- <div class="accent-border-left flex-center"> -->
        <h1>LaPointe's Cooking Compendium</h1>
        <div class="break"></div>

        <h3 class="italic">...is the last cookbook you will ever need.</h3>
        <!-- </div> -->

    </div>
    <div id="sample-container">
        <div id="sample-cards">
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/th-928319788" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Recipe Of The Week</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/beef_stew.jpg" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Top Rated</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/sushi.jpg" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Something Different</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/english_breakfast.jpg" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Breakfast</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/taiwanese_soup.jpeg" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Lunch</h3>
            </div>
            <div class="sample-item">
                <a href="recipe.php">
                    <img class="sample-image" src="images/pizza.jpeg" alt="sample image">
                </a>
                <div class="break"></div>
                <h3>Dinner</h3>
            </div>
        </div>
    </div>

</main>
<?php
        include 'footer.php';
    ?>
</body>

</html>