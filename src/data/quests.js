const QUESTS = [
  {
    id: 'quest_naboo_invasion',
    title: 'Shadows over Naboo',
    giver: { planet: 'naboo', npcLoreId: 'char_padme_amidala' },
    summary: 'Queen Amidala asks you to uncover who is truly behind the blockade of Naboo.',
    steps: [
      { id: 's1', hint: 'Seek counsel from Chancellor Palpatine on Coruscant',
        objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
      { id: 's2', hint: 'Find evidence of the plot against the Queen on Coruscant',
        objective: { type: 'discover', loreId: 'event_assassination_padme' } },
      { id: 's3', hint: 'Slip through the occupied Royal Palace on Naboo',
        objective: { type: 'challenge', planet: 'naboo', challengeId: 'naboo_palace' } },
      { id: 's4', hint: 'Confront the threat at the Generator Core',
        objective: { type: 'enter', planet: 'naboo', landmarkId: 'lm_battle_naboo' } }
    ],
    reward: { holocronLoreId: 'holo_naboo', maxHealthBonus: 20 }
  },
  {
    id: 'quest_cloners_secret',
    title: "The Cloners' Secret",
    giver: { planet: 'kamino', npcLoreId: 'char_kit_fisto' },
    summary: 'Master Fisto suspects the clone army was not commissioned by the Jedi Council at all.',
    steps: [
      { id: 's1', hint: 'Question Jango Fett, the clone template, on Kamino',
        objective: { type: 'talk', planet: 'kamino', npcLoreId: 'char_jango_fett' } },
      { id: 's2', hint: 'Review the Grand Army records on Kamino',
        objective: { type: 'discover', loreId: 'faction_grand_army_republic' } },
      { id: 's3', hint: 'Cross the Geonosian droid foundry',
        objective: { type: 'challenge', planet: 'geonosis', challengeId: 'geonosis_foundry' } },
      { id: 's4', hint: 'Confront Count Dooku in the Petranaki Arena',
        objective: { type: 'talk', planet: 'geonosis', npcLoreId: 'char_count_dooku' } }
    ],
    reward: { holocronLoreId: 'holo_clones', maxHealthBonus: 20 }
  },
  {
    id: 'quest_sith_trail',
    title: 'The Sith Trail',
    giver: { planet: 'coruscant', npcLoreId: 'char_mace_windu' },
    summary: 'Master Windu senses a Sith hand behind the war and asks you to follow the trail.',
    steps: [
      { id: 's1', hint: 'Press the Chancellor about the Sith threat on Coruscant',
        objective: { type: 'talk', planet: 'coruscant', npcLoreId: 'char_palpatine' } },
      { id: 's2', hint: 'Search the Jedi Temple archives',
        objective: { type: 'enter', planet: 'coruscant', landmarkId: 'lm_jedi_order' } },
      { id: 's3', hint: 'Cross the lava fields of Mustafar',
        objective: { type: 'challenge', planet: 'mustafar', challengeId: 'mustafar_lava' } },
      { id: 's4', hint: 'Reach the lava riverside platform',
        objective: { type: 'enter', planet: 'mustafar', landmarkId: 'lm_duel_mustafar' } }
    ],
    reward: { holocronLoreId: 'holo_sith', maxHealthBonus: 20 }
  }
]

export function getQuests() {
  return QUESTS
}
