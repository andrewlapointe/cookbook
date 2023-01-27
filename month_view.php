<?php
    include 'nav.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/navbar.css" />
    <link rel="stylesheet" href="css/month_view.css" />
    <title>Document</title>
</head>

<body>
    <div class="flex-container">
        <div class="grid-row">
            <?php
                for ($column = 0; $column <= 6; $column++) {
                    echo "<p class='grid-element' id='test'>The number is:$column</p>";
                }
            ?>
        </div>
        <div class="grid-row">
            <?php
                for ($column = 0; $column <= 6; $column++) {
                    echo "<p class='grid-element'>The number is:$column</p>";
                }
            ?>
        </div>
        <div class="grid-row">
            <?php
                for ($column = 0; $column <= 6; $column++) {
                    echo "<p class='grid-element'>The number is:$column</p>";
                }
            ?>
        </div>
        <div class="grid-row">
            <?php
                for ($column = 0; $column <= 6; $column++) {
                    echo "<p class='grid-element'>The number is:$column</p>";
                }
            ?>
        </div>
        <div class="grid-row">
            <?php
                for ($column = 0; $column <= 6; $column++) {
                    echo "<p class='grid-element'>The number is:$column</p>";
                }
            ?>
        </div>

    </div>

</body>
</html>


