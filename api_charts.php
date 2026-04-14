<?php
header('Content-Type: application/json');
include('_statistics.php');

echo json_encode([
    'stats'              => getGeneralStats(),
    'usuariosPorClase'   => getUsuariosPorClase(),
    'clasesPorRaza'      => getClasesPorRaza(),
    'usuariosPorLevel'   => getUsuariosPorLevel(),
    'killsPorClase'      => getKillsPorClase(),
    'onlinePorHora'      => getUsuariosOnlinePorHora(),
]);
