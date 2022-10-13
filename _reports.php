<?php

function listFolderFiles($dir){
    foreach(scandir($dir) as $file){
        if ($file[0] == '.')
            continue;
        if (is_dir("$dir/$file"))
            foreach (listFolderFiles("$dir/$file") as $infile)
                yield $infile;
        else
            yield "${dir}/${file}";
    }
}

function scanDirOrderByModifiedDate($dir) {
    $ignored = array('.', '..', '.svn', '.htaccess', ".html");

    $files = array();    
    foreach (scandir($dir) as $file) {
        if (in_array($file, $ignored)) continue;
        $files[$file] = filemtime($dir . '/' . $file);
    }

    arsort($files);
    $files = array_keys($files);

    return ($files) ? $files : false;
}

function getLastReport($dir){
    $files = scanDirOrderByModifiedDate($dir);
    if (!$files) {
        die("No hay archivos de reporte");
    }

    $filePath = $dir . "/" . $files[0];
    $f = fopen($filePath, 'r');
    
    if ($f) {
        $contents = fread($f, filesize($filePath));
        fclose($f);
        header("Content-Type: application/json");
        echo $contents;
        exit();
    }
}
