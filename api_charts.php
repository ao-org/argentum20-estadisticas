<?php
header('Content-Type: application/json');
include('_statistics.php');

function safeCall($fn) {
    try { return $fn(); }
    catch (Throwable $e) {
        error_log('[Argentum Online Stats] ' . $e->getMessage());
        return null;
    }
}

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

    // PvP & Combat (Reqs 1-5)
    'ciudadanosVsCriminales'   => safeCall('getCiudadanosVsCriminales'),
    'mostDangerousClasses'     => safeCall('getMostDangerousClasses'),
    'pvpByLevelBracket'        => safeCall('getPvpByLevelBracket'),
    'reenlistadasDistribution' => safeCall('getReenlistadasDistribution'),
    'deathKillHeatmap'         => safeCall('getDeathKillHeatmap'),

    // Economy & Items (Reqs 6-10)
    'giniLorenz'               => safeCall('getGiniLorenz'),
    'bankUsageRate'            => safeCall('getBankUsageRate'),
    'mostHoardedItems'         => safeCall('getMostHoardedItems'),
    'equippedVsUnequipped'     => safeCall('getEquippedVsUnequipped'),
    'elementalTagsDistribution' => safeCall('getElementalTagsDistribution'),

    // Social & Guilds (Reqs 11-16)
    'skinAdoption'             => safeCall('getSkinAdoption'),
    'guildSizeDistribution'    => safeCall('getGuildSizeDistribution'),
    'guildRejectionRate'       => safeCall('getGuildRejectionRate'),
    'marriageRate'             => safeCall('getMarriageRate'),
    'guildAlignmentBalance'    => safeCall('getGuildAlignmentBalance'),
    'guildConcentration'       => safeCall('getGuildConcentration'),

    // Character Building (Reqs 17-19)
    'skillPointPatterns'       => safeCall('getSkillPointPatterns'),
    'spellPopularity'          => safeCall('getSpellPopularity'),
    'petOwnership'             => safeCall('getPetOwnership'),

    // Activity & Misc (Reqs 20-24)
    'multiCharacterAccounts'   => safeCall('getMultiCharacterAccounts'),
    'charactersPerMap'         => safeCall('getCharactersPerMap'),
    'deadCharacterRate'        => safeCall('getDeadCharacterRate'),
    'sailingRate'              => safeCall('getSailingRate'),
    'fishingCombatCorrelation' => safeCall('getFishingCombatCorrelation'),

    // Events & Server Health (Reqs 25-30)
    'globalQuestParticipation' => safeCall('getGlobalQuestParticipation'),
    'globalQuestCompletion'    => safeCall('getGlobalQuestCompletion'),
    'accountRetention'         => safeCall('getAccountRetention'),
    'patronDonorRate'          => safeCall('getPatronDonorRate'),
    'questCompletionByClass'   => safeCall('getQuestCompletionByClass'),
    'deathsVsLevelCurve'      => safeCall('getDeathsVsLevelCurve'),
]);
