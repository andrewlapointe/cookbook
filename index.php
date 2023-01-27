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
    <link rel="stylesheet" href="css/navbar.css" />
    <link rel="stylesheet" href="css/home.css" />
    <title>LaPointe Cooking Compendium</title>
</head>

<body class="home">
    <p>This is a paragraph</p>
    <?php if (1 == 1){ ?>
       <p>Hello World!</p>
    <?php }?>
    <p>This is a paragraph</p>

    <?php
        $sql = "SELECT * FROM users;";
        $results = mysqli_query($conn, $sql);
        $resultCheck = mysqli_num_rows($results);

        if ($resultCheck > 0) {
            while ($row = mysqli_fetch_assoc($results)) {
                echo "<p class='blue'> {$row["username"]} </p>";
            }
        }
    ?>

    <form action="functions.php" method="get">
        <input type="text" name="num01" placeholder="Number 1">
        <select name="oper">
            <label for="">Choose Operation</label>
            <option value="add">Add</option>
            <option value="sub">Subtract</option>
        </select>
        <input type="text" name="num02" placeholder="Number 2">
        <button type="submit">Calculate!</button>
    </form>
    <script src="js/test.js"></script>
</body>
</html>