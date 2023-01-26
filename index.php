<?php
    include_once 'includes/dbh.inc.php';
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/navbar.css" />
    <link rel="stylesheet" href="css/home.css" />
    <title>LaPointe Cooing Compendium</title>
</head>
<header>
      <div id="navbar" style="z-index: 10">
        <a href="index.php">Home</a>
        <a href="month_view.php">Month View</a>
        <a href="">placeholder
        <a href="">placeholder</a>
        <a href="about.php">About</a>
        
        <!-- <a href=""></a> -->
        <button
          onclick="window.location.href='https://github.com/andrewlapointe';"
          class="btn"
          style="z-index: 12"
        >
          GitHub
        </button>
      </div>
</header>
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
                echo $row['user_first'] . "<br>";
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