const FACTION_COLORS = {
  republic: 0x4a90d9,
  separatist: 0xd9534a,
  neutral: 0x9aa0a6
}

export function factionColor(faction) {
  return FACTION_COLORS[faction] ?? FACTION_COLORS.neutral
}
