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