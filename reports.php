<?php
  include('_reports.php');
  $directory = '../' . $_GET['dir'];

  if (isset($_GET['last']) && $_GET['last'] == 'true') {
    echo getLastReport($directory);
    die();
  }
  
  foreach (listFolderFiles($directory) as $file) {
    echo '<a href="' . $directory . $file .'">'. $file .'</a><br>';
  }
?>
