<h1> Lista de reportes </h1>
<?php
  include('_reports.php');
  
  foreach (listFolderFiles('../reports') as $file) {
    echo '<a href="../reports/'. $file .'">'. $file .'</a><br>';
  }
?>