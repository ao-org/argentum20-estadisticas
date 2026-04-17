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
    'eloDistribution'    => getEloDistribution(),
    'topGuilds'          => getTopGuilds(),
    'goldByLevelRange'   => getGoldByLevelRange(),
    'kdRatioByClass'     => getKdRatioByClass(),
    'factionSummary'     => getFactionSummary(),
    'fishingLeaderboard' => getFishingLeaderboard(),
    'questCompletion'    => getQuestCompletion(),
    'genderDistribution' => getGenderDistribution(),
    'globalQuestProgress'=> getGlobalQuestProgress(),
    'topNpcHunters'      => getTopNpcHunters(),
]);
