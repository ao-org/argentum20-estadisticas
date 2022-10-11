<?php
  include('_reports.php');
  
  if ($_GET['last'] == 'true') {
    echo getLastReport('../reports');
    die();
  }
  
  foreach (listFolderFiles('../reports') as $file) {
    echo '<a href="../reports/'. $file .'">'. $file .'</a><br>';
  }
?>