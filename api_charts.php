<?php
header('Content-Type: application/json');
include('_statistics.php');

echo json_encode([
    'stats'              => getGeneralStats(),
    'usuariosPorClase'   => getUsuariosPorClase(),
    'clasesPorRaza'      => getClasesPorRaza(),
    'usuariosPorLevel'   => getUsuariosPorLevel(),
    'killsPorClase'      => getKillsPorClase(),
    'eloDistribution'    => getEloDistribution(),
    'topGuilds'          => getTopGuilds(),
    'goldByLevelRange'   => getGoldByLevelRange(),
    'kdRatioByClass'     => getKdRatioByClass(),
    'factionSummary'     => getFactionSummary(),
    'fishingLeaderboard' => getFishingLeaderboard(),
    'genderDistribution' => getGenderDistribution(),
    'topNpcHunters'      => getTopNpcHunters(),
]);
