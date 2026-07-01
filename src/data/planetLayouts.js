export const planetLayouts = {
  coruscant: {
    name: 'Coruscant',
    faction: 'republic',
    galaxyPos: { x: 180, y: 160 },
    bg: 0x0b0e15,
    palette: { floor: 0x1b2330, accent: 0xc8a24a, structure: 0x39414f },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_coruscant_planet', name: 'Senate District', x: 200, y: 160, w: 300, h: 200, loreId: 'planet_coruscant' },
      { id: 'lm_jedi_order', name: 'Jedi Temple', x: 1100, y: 180, w: 320, h: 220, loreId: 'faction_jedi_order' },
      { id: 'lm_declaration', name: 'Senate Rotunda', x: 250, y: 900, w: 280, h: 180, loreId: 'event_declaration_new_order' }
    ],
    interactables: [
      {
        type: 'npc', x: 1300, y: 400, loreId: 'char_palpatine',
        name: 'Supreme Chancellor Palpatine', faction: 'republic',
        lines: [
          'Welcome, traveler. The Senate debates endlessly while the galaxy suffers.',
          'Power, true power, is not given—it is taken by those with the vision to wield it.',
          'I assure you, everything that has transpired has done so according to my design.'
        ]
      },
      {
        type: 'npc', x: 1050, y: 850, loreId: 'char_mace_windu',
        name: 'Mace Windu', faction: 'republic',
        lines: [
          'The dark side of the Force surrounds the Chancellor. I sense it clearly.',
          'Our ability to use the Force has diminished these past years. Something obscures our vision.',
          'We must be cautious. The Jedi are not an army—we are keepers of the peace.'
        ]
      },
      {
        type: 'terminal', x: 700, y: 950, loreId: 'species_human'
      },
      {
        type: 'artifact', x: 1400, y: 950, loreId: 'event_assassination_padme'
      },
      {
        type: 'npc', x: 400, y: 450, loreId: 'species_besalisk',
        name: 'Dexter Jettster', faction: 'neutral',
        lines: [
          'You want the best noodles on Coruscant? You came to the right diner, friend.',
          'I know this saberdart—only one place in the galaxy you can buy these. Kamino.',
          'You Jedi are too tied to your archives. Sometimes you gotta ask the old friends.'
        ]
      }
    ]
  },

  naboo: {
    name: 'Naboo',
    faction: 'republic',
    galaxyPos: { x: 360, y: 130 },
    bg: 0x0a1a0e,
    palette: { floor: 0x1a3020, accent: 0x4a9a6a, structure: 0x8ab870 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_naboo_planet', name: 'Theed Royal Palace', x: 200, y: 180, w: 320, h: 200, loreId: 'planet_naboo' },
      { id: 'lm_invasion_naboo', name: 'Trade Federation Landing Zone', x: 1050, y: 200, w: 300, h: 180, loreId: 'event_invasion_naboo' },
      { id: 'lm_battle_naboo', name: 'Generator Core', x: 1100, y: 900, w: 280, h: 200, loreId: 'event_battle_naboo' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 800, loreId: 'char_padme_amidala',
        name: 'Queen Amidala', faction: 'republic',
        lines: [
          'Our people are dying, Senator. We must act—there is no time for endless debates.',
          'I was not elected to watch my people suffer while the Senate deliberates.',
          'I will not condone a course of action that will lead us to war.'
        ]
      },
      {
        type: 'npc', x: 650, y: 350, loreId: 'char_jar_jar_binks',
        name: 'Jar Jar Binks', faction: 'republic',
        lines: [
          'Mesa Jar Jar Binks! Yousa come to Naboo? Is bombad beautiful, no?',
          'Mesa clumsy, but mesa heart issen in da right place, guaranteed.',
          'Wesa Gungans and da Naboo, wesa now friends. Dats very good, yah!'
        ]
      },
      {
        type: 'terminal', x: 1350, y: 480, loreId: 'species_gungan'
      },
      {
        type: 'artifact', x: 250, y: 950, loreId: 'char_darth_maul'
      },
      {
        type: 'artifact', x: 1350, y: 950, loreId: 'species_zabrak'
      }
    ],
    challenges: {
      naboo_palace: {
        name: 'Royal Palace (Occupied)',
        bounds: { x: 880, y: 360, w: 620, h: 440 },
        checkpoint: { x: 930, y: 760 },
        goal: { x: 1400, y: 400, w: 70, h: 70 },
        hazards: [
          { type: 'patrol', x: 1050, y: 460, w: 34, h: 34, damage: 18, speed: 130, axis: 'y', range: 200 },
          { type: 'patrol', x: 1220, y: 700, w: 34, h: 34, damage: 18, speed: 110, axis: 'x', range: 200 },
          { type: 'sweep',  x: 1140, y: 580, length: 200, damage: 30, speed: 70 },
          { type: 'static', x: 980, y: 420, w: 60, h: 60, damage: 10 }
        ]
      }
    }
  },

  kamino: {
    name: 'Kamino',
    faction: 'republic',
    galaxyPos: { x: 120, y: 280 },
    bg: 0x050d1a,
    palette: { floor: 0x8ec8e8, accent: 0xd8f0ff, structure: 0x3a6a8a },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_kamino_planet', name: 'Tipoca City Cloning Facility', x: 200, y: 180, w: 340, h: 220, loreId: 'planet_kamino' },
      { id: 'lm_battle_kamino', name: 'Cloning Bay Alpha', x: 1050, y: 200, w: 300, h: 200, loreId: 'event_battle_kamino' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_jango_fett',
        name: 'Jango Fett', faction: 'neutral',
        lines: [
          'I am no Jedi, but I know how to handle myself. Keep your distance.',
          'The clone army is the finest in the galaxy. I made sure of that personally.',
          'Boba is all that matters to me. Not the Republic, not the Separatists—just him.'
        ]
      },
      {
        type: 'npc', x: 1300, y: 850, loreId: 'char_kit_fisto',
        name: 'Kit Fisto', faction: 'republic',
        lines: [
          'The Force flows strongly in these waters. Even the Kaminoans sense it.',
          'I have faced Separatist forces in far worse conditions than this. We will prevail.',
          'Stay focused—and perhaps smile a little. It helps in battle, believe me.'
        ]
      },
      {
        type: 'terminal', x: 700, y: 350, loreId: 'faction_galactic_republic'
      },
      {
        type: 'terminal', x: 1100, y: 950, loreId: 'faction_grand_army_republic'
      },
      {
        type: 'terminal', x: 400, y: 400, loreId: 'species_kaminoan'
      },
      {
        type: 'artifact', x: 1350, y: 400, loreId: 'species_nautolan'
      }
    ]
  },

  geonosis: {
    name: 'Geonosis',
    faction: 'separatist',
    galaxyPos: { x: 1020, y: 580 },
    bg: 0x1a0e05,
    palette: { floor: 0x6a3a18, accent: 0xc87830, structure: 0x8a5028 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_geonosis_planet', name: 'Petranaki Arena', x: 200, y: 180, w: 320, h: 220, loreId: 'planet_geonosis' },
      { id: 'lm_first_battle_geonosis', name: 'Droid Foundry', x: 1050, y: 180, w: 300, h: 200, loreId: 'event_first_battle_geonosis' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_count_dooku',
        name: 'Count Dooku', faction: 'separatist',
        lines: [
          'The Republic is a lie maintained by fearful men. Come—see the truth of it.',
          'I have seen what the Senate truly is. Corruption from top to bottom.',
          'This is not the end of the Jedi, Master Kenobi. It is merely a... transition.'
        ]
      },
      {
        type: 'npc', x: 1300, y: 400, loreId: 'char_boba_fett',
        name: 'Boba Fett', faction: 'neutral',
        lines: [
          'My dad was the best bounty hunter in the galaxy. I\'ll prove I am too.',
          'He taught me everything—how to fight, how to survive, who to trust.',
          'I saw Mace Windu kill him. I won\'t forget that.'
        ]
      },
      {
        type: 'npc', x: 700, y: 350, loreId: 'char_ki_adi_mundi',
        name: 'Ki-Adi-Mundi', faction: 'republic',
        lines: [
          'My binary brain has analyzed the tactical situation. The odds are not in our favor.',
          'The Cerean way is to think before acting. Here on Geonosis, there is little time for either.',
          'I sense a great disturbance—thousands of battle droids, and only two hundred Jedi.'
        ]
      },
      {
        type: 'terminal', x: 1100, y: 850, loreId: 'faction_techno_union'
      },
      {
        type: 'terminal', x: 350, y: 400, loreId: 'species_geonosian'
      },
      {
        type: 'artifact', x: 1350, y: 950, loreId: 'species_cerean'
      }
    ],
    challenges: {
      geonosis_foundry: {
        name: 'Droid Foundry Line',
        bounds: { x: 880, y: 360, w: 620, h: 440 },
        checkpoint: { x: 930, y: 760 },
        goal: { x: 1400, y: 400, w: 70, h: 70 },
        hazards: [
          { type: 'patrol', x: 1180, y: 480, w: 44, h: 44, damage: 22, speed: 160, axis: 'x', range: 200 },
          { type: 'patrol', x: 1280, y: 700, w: 44, h: 44, damage: 22, speed: 140, axis: 'y', range: 100 },
          { type: 'static', x: 1000, y: 620, w: 80, h: 40, damage: 16 },
          { type: 'static', x: 1240, y: 460, w: 40, h: 80, damage: 16 }
        ]
      }
    }
  },

  kashyyyk: {
    name: 'Kashyyyk',
    faction: 'republic',
    galaxyPos: { x: 290, y: 220 },
    bg: 0x071208,
    palette: { floor: 0x1a4020, accent: 0x3a8040, structure: 0x2a6030 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_kashyyyk_planet', name: 'Kachirho Tree City', x: 200, y: 160, w: 320, h: 220, loreId: 'planet_kashyyyk' },
      { id: 'lm_battle_kashyyyk', name: 'Wookiee Beachhead', x: 1050, y: 180, w: 300, h: 200, loreId: 'event_battle_kashyyyk' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_yoda',
        name: 'Master Yoda', faction: 'republic',
        lines: [
          'Hmm. Strong with the Force, this world is. Old it is—older than the Republic.',
          'Fear leads to anger. Anger leads to hatred. Hatred... leads to suffering.',
          'When nine hundred years old you reach, look as good you will not, hmm?'
        ]
      },
      {
        type: 'npc', x: 1300, y: 400, loreId: 'char_plo_koon',
        name: 'Plo Koon', faction: 'republic',
        lines: [
          'The Wookiees fight with a ferocity born from love of their home. We honor that.',
          'I discovered young Ahsoka on Shili—her potential in the Force was unmistakable.',
          'We Kel Dor see truths others miss. The clone inhibitor chips trouble me deeply.'
        ]
      },
      {
        type: 'npc', x: 1100, y: 850, loreId: 'char_bail_organa',
        name: 'Bail Organa', faction: 'republic',
        lines: [
          'Alderaan stands with the Republic and with the Wookiees in their hour of need.',
          'Palpatine\'s emergency powers have grown far beyond what the Senate authorized.',
          'We must protect what is left of democracy, even if the Chancellor cannot see the threat he poses.'
        ]
      },
      {
        type: 'terminal', x: 700, y: 350, loreId: 'event_order_66'
      },
      {
        type: 'terminal', x: 400, y: 400, loreId: 'species_wookiee'
      },
      {
        type: 'terminal', x: 1350, y: 950, loreId: 'species_kel_dor'
      }
    ]
  },

  mustafar: {
    name: 'Mustafar',
    faction: 'separatist',
    galaxyPos: { x: 1080, y: 630 },
    bg: 0x1a0400,
    palette: { floor: 0x3a0800, accent: 0xff4400, structure: 0x1a0200 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_mustafar_planet', name: 'Separatist Stronghold', x: 200, y: 180, w: 320, h: 200, loreId: 'planet_mustafar' },
      { id: 'lm_duel_mustafar', name: 'Lava Riverside Platform', x: 1050, y: 900, w: 300, h: 180, loreId: 'event_duel_mustafar' }
    ],
    interactables: [
      {
        type: 'artifact', x: 400, y: 900, loreId: 'char_anakin_skywalker'
      },
      {
        type: 'terminal', x: 1300, y: 350, loreId: 'faction_confederacy'
      },
      {
        type: 'artifact', x: 700, y: 350, loreId: 'faction_sith'
      },
      {
        type: 'terminal', x: 350, y: 400, loreId: 'faction_banking_clan'
      },
      {
        type: 'artifact', x: 1300, y: 900, loreId: 'species_neimoidian'
      }
    ],
    challenges: {
      mustafar_lava: {
        name: 'Lava Field Crossing',
        bounds: { x: 880, y: 360, w: 620, h: 440 },
        checkpoint: { x: 930, y: 760 },
        goal: { x: 1400, y: 400, w: 70, h: 70 },
        hazards: [
          { type: 'static', x: 1020, y: 500, w: 90, h: 90, damage: 14 },
          { type: 'static', x: 1220, y: 620, w: 90, h: 90, damage: 14 },
          { type: 'sweep',  x: 1140, y: 560, length: 220, damage: 34, speed: 60 },
          { type: 'patrol', x: 1320, y: 700, w: 34, h: 34, damage: 20, speed: 150, axis: 'y', range: 80 }
        ]
      }
    }
  },

  utapau: {
    name: 'Utapau',
    faction: 'separatist',
    galaxyPos: { x: 1140, y: 490 },
    bg: 0x0e100a,
    palette: { floor: 0x6a7850, accent: 0x9aaa70, structure: 0x4a5438 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_utapau_planet', name: 'Pau City Sinkhole', x: 200, y: 180, w: 320, h: 220, loreId: 'planet_utapau' },
      { id: 'lm_battle_utapau', name: 'Tenth Level Landing Deck', x: 1050, y: 900, w: 300, h: 200, loreId: 'event_battle_utapau' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_obi_wan_kenobi',
        name: 'Obi-Wan Kenobi', faction: 'republic',
        lines: [
          'Hello there. I have tracked General Grievous to this world—I will need a guarlara.',
          'Negotiations are short on Utapau. The Separatists have taken the city by force.',
          'I have the high ground, Grievous. Don\'t try it.'
        ]
      },
      {
        type: 'artifact', x: 1300, y: 400, loreId: 'char_general_grievous'
      },
      {
        type: 'terminal', x: 1100, y: 400, loreId: 'species_pau_an'
      }
    ]
  },

  tatooine: {
    name: 'Tatooine',
    faction: 'neutral',
    galaxyPos: { x: 700, y: 460 },
    bg: 0x1a1000,
    palette: { floor: 0xc8a040, accent: 0xe8c060, structure: 0x806020 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_tatooine_planet', name: 'Mos Espa Slave Quarters', x: 200, y: 180, w: 300, h: 200, loreId: 'planet_tatooine' },
      { id: 'lm_boonta_eve', name: 'Mos Espa Grand Arena', x: 1050, y: 200, w: 320, h: 220, loreId: 'event_boonta_eve_classic' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_qui_gon_jinn',
        name: 'Qui-Gon Jinn', faction: 'republic',
        lines: [
          'I feel a disturbance in the Force here. This desert world hides something remarkable.',
          'The Living Force speaks to me clearly—there is a boy here whose potential is extraordinary.',
          'Mind tricks don\'t work on Toydarians. We must find another way to win his freedom.'
        ]
      },
      {
        type: 'npc', x: 1300, y: 850, loreId: 'char_watto',
        name: 'Watto', faction: 'neutral',
        lines: [
          'What do you want? I\'m a busy man. I run the best junk shop in Mos Espa!',
          'Mind tricks? On me? Ha! No Jedi tricks work on Watto. You deal straight or you leave.',
          'That kid Anakin—I should have kept him. Best mechanic I ever had, I tell you.'
        ]
      },
      {
        type: 'npc', x: 700, y: 350, loreId: 'char_shmi_skywalker',
        name: 'Shmi Skywalker', faction: 'neutral',
        lines: [
          'Anakin knows nothing of his father. There was no father—I cannot explain it.',
          'My son has a special gift. I am glad the Jedi will train him, even if it breaks my heart.',
          'Every day I pray to see him again. A mother\'s hope is stronger than any chains.'
        ]
      },
      {
        type: 'npc', x: 400, y: 400, loreId: 'char_sebulba',
        name: 'Sebulba', faction: 'neutral',
        lines: [
          'Poodoo! You dare challenge Sebulba? The greatest podracer on this circuit?',
          'I always win. Always. By any means necessary—and nobody can prove otherwise.',
          'That slave boy beat me? Impossible! His pod was sabotaged, I tell you!'
        ]
      },
      {
        type: 'terminal', x: 1100, y: 400, loreId: 'species_hutt'
      },
      {
        type: 'npc', x: 1300, y: 350, loreId: 'faction_hutt_cartel',
        name: 'Jabba\'s Majordomo', faction: 'neutral',
        lines: [
          'You approach the great Jabba\'s territory uninvited. This is... unwise.',
          'All transactions on Tatooine flow through the Hutt Cartel. Remember that.',
          'Perhaps we can arrange something mutually beneficial. Credits first, questions later.'
        ]
      }
    ]
  },

  mandalore: {
    name: 'Mandalore',
    faction: 'neutral',
    galaxyPos: { x: 540, y: 330 },
    bg: 0x0a0c0e,
    palette: { floor: 0x3a4050, accent: 0xc8a830, structure: 0x5a6070 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_mandalore_planet', name: 'Sundari Dome', x: 200, y: 180, w: 320, h: 200, loreId: 'planet_mandalore' },
      { id: 'lm_siege_mandalore', name: 'Sundari Throne Room', x: 1050, y: 180, w: 300, h: 200, loreId: 'event_siege_mandalore' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_mon_mothma',
        name: 'Mon Mothma', faction: 'republic',
        lines: [
          'The Petition of 2000 was not treason—it was a desperate plea for accountability.',
          'When a democracy elects to abandon its principles, it ceases to be a democracy.',
          'History will judge us by what we did when the Republic needed us most.'
        ]
      },
      {
        type: 'npc', x: 1300, y: 400, loreId: 'char_cad_bane',
        name: 'Cad Bane', faction: 'neutral',
        lines: [
          'I don\'t take sides. I take credits. Whoever pays more gets my gun.',
          'Jango Fett is gone. Someone has to be the best bounty hunter in the galaxy.',
          'Keep walking, friend. Unless you\'ve got a contract for me—or on me.'
        ]
      },
      {
        type: 'npc', x: 700, y: 350, loreId: 'faction_death_watch',
        name: 'Pre Vizsla', faction: 'separatist',
        lines: [
          'The New Mandalorians are cowards who hid behind walls. We restore the old ways.',
          'This is the Darksaber—symbol of Mandalore\'s true rulers. It belongs to Death Watch.',
          'Pacifism is not peace. It is surrender dressed in peaceful clothes.'
        ]
      },
      {
        type: 'terminal', x: 350, y: 400, loreId: 'event_outbreak_clone_wars'
      },
      {
        type: 'artifact', x: 1100, y: 950, loreId: 'event_jedi_temple_attack'
      },
      {
        type: 'terminal', x: 1350, y: 950, loreId: 'species_mandalorian'
      }
    ]
  },

  ryloth: {
    name: 'Ryloth',
    faction: 'neutral',
    galaxyPos: { x: 760, y: 390 },
    bg: 0x0a0508,
    palette: { floor: 0x402030, accent: 0x9050a0, structure: 0x281020 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_ryloth_planet', name: 'Twi\'lek Freedom Fighter Camp', x: 200, y: 180, w: 320, h: 200, loreId: 'planet_ryloth' },
      { id: 'lm_battle_ryloth', name: 'Lessu City Bridge', x: 1050, y: 200, w: 300, h: 200, loreId: 'event_battle_ryloth' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_aayla_secura',
        name: 'Aayla Secura', faction: 'republic',
        lines: [
          'My people have suffered under Separatist occupation long enough. Today we fight back.',
          'The Force guides us, but so does the will of the Twi\'lek freedom fighters.',
          'Ryloth will be free. General Windu and I will see to it personally.'
        ]
      },
      {
        type: 'npc', x: 1300, y: 850, loreId: 'faction_galactic_senate',
        name: 'Orn Free Taa', faction: 'republic',
        lines: [
          'The Senate debates aid packages while my people starve. It is unconscionable.',
          'Ryloth has loyal senators—but loyalty demands the Republic reciprocate.',
          'Cham Syndulla does not trust the Republic. He may be wiser than I credited.'
        ]
      },
      {
        type: 'terminal', x: 700, y: 350, loreId: 'species_twilek'
      },
      {
        type: 'artifact', x: 1350, y: 400, loreId: 'char_asajj_ventress'
      },
      {
        type: 'artifact', x: 350, y: 400, loreId: 'species_toydarian'
      }
    ]
  },

  christophsis: {
    name: 'Christophsis',
    faction: 'neutral',
    galaxyPos: { x: 650, y: 290 },
    bg: 0x08100a,
    palette: { floor: 0x50c8a0, accent: 0x80f8d0, structure: 0x289070 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_christophsis_planet', name: 'Crystal Spire District', x: 200, y: 180, w: 320, h: 200, loreId: 'planet_christophsis' },
      { id: 'lm_battle_christophsis', name: 'Separatist Blockade Wreckage', x: 1050, y: 200, w: 300, h: 200, loreId: 'event_battle_christophsis' }
    ],
    interactables: [
      {
        type: 'terminal', x: 700, y: 350, loreId: 'char_wilhuff_tarkin'
      },
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_ahsoka_tano',
        name: 'Ahsoka Tano', faction: 'republic',
        lines: [
          'My name is Ahsoka Tano. Master Yoda assigned me to be your new Padawan.',
          'I may be young, but I\'ve trained hard. I can hold my own in a fight, Skyguy.',
          'This is my first real battle. I\'m nervous—but ready. The Force will guide me.'
        ]
      },
      {
        type: 'npc', x: 1300, y: 400, loreId: 'char_captain_rex',
        name: 'Captain Rex', faction: 'republic',
        lines: [
          'CT-7567, Captain Rex, sir. I serve under General Skywalker and proud of it.',
          'In my experience, the Jedi leading the charge makes all the difference.',
          'I follow orders—but I\'ve also learned when the mission needs improvisation.'
        ]
      },
      {
        type: 'npc', x: 1100, y: 850, loreId: 'faction_501st_legion',
        name: 'Clone Trooper Fives', faction: 'republic',
        lines: [
          'Five-Five-Five-Five reporting for duty. The 501st doesn\'t leave a man behind.',
          'General Skywalker leads from the front. That\'s why we follow him into anything.',
          'We\'re more than our template, sir. Each of us is our own soldier.'
        ]
      },
      {
        type: 'artifact', x: 350, y: 400, loreId: 'species_togruta'
      }
    ]
  },

  rodia: {
    name: 'Rodia',
    faction: 'separatist',
    galaxyPos: { x: 890, y: 510 },
    bg: 0x05100a,
    palette: { floor: 0x184828, accent: 0x30a050, structure: 0x0a2814 },
    size: { width: 1600, height: 1200 },
    spawn: { x: 800, y: 600 },
    landmarks: [
      { id: 'lm_rodia_planet', name: 'Iskaayuma Spaceport', x: 200, y: 180, w: 320, h: 200, loreId: 'planet_rodia' }
    ],
    interactables: [
      {
        type: 'npc', x: 350, y: 850, loreId: 'char_nute_gunray',
        name: 'Nute Gunray', faction: 'separatist',
        lines: [
          'The Trade Federation\'s demands are non-negotiable. Senator Farr understands this.',
          'Padmé Amidala humiliated me on Naboo. I will see her delivered to Lord Sidious.',
          'We are a commercial organization—war is merely an extension of our business interests.'
        ]
      },
      {
        type: 'terminal', x: 1300, y: 400, loreId: 'faction_trade_federation'
      },
      {
        type: 'artifact', x: 700, y: 350, loreId: 'event_mission_rodia'
      },
      {
        type: 'artifact', x: 1100, y: 850, loreId: 'species_dug'
      },
      {
        type: 'terminal', x: 350, y: 400, loreId: 'species_mon_calamari'
      },
      {
        type: 'terminal', x: 1350, y: 950, loreId: 'species_rodian'
      }
    ]
  }
}
