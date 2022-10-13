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

function getLastReport($dir){
    $files = scandir($dir, SCANDIR_SORT_DESCENDING);
    $filePath = $dir . "/" . $files[0];
    $f = fopen($filePath, 'r');
    
    if ($f) {
        $contents = fread($f, filesize($filePath));
        fclose($f);

        header("Content-Type: application/json");

        $json = preg_replace("!\r?\n!", "", $contents);
        echo json_encode($json);
        exit();
    }
}