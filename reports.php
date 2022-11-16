<?php
  include('_reports.php');
  $dir = "";

  switch ($_GET['dir']) {
    case "reports":
      $dir = "reports";
      break;
      
    default:
      $dir = "reports";
  }

  $directory = '../' . $dir;

  if (isset($_GET['last']) && $_GET['last'] == 'true') {
    echo getLastReport($directory);
    die();
  }
  
  foreach (listFolderFiles($directory) as $file) {
    echo '<a href="' . $file .'">'. $file .'</a><br>';
  }
?>
