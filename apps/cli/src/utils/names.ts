/**
 * Theme-based name generators for bot, group, and username creation.
 *
 * Generates creative names combining cyberpunk, cannabis, and hackerman themes.
 *
 * @module
 */

/**
 * Theme word banks for name generation.
 */
const THEME_GENERATORS = {
  prefixes: [
    'Cyber', 'Dark', 'Ghost', 'Shadow', 'Crypto', 'Stealth', 'Hack', 'Zero',
    'Null', 'Void', 'Root', 'Shell', 'Code', 'Bit', 'Byte', 'Pixel', 'Glitch',
    'Matrix', 'Neural', 'Quantum', 'Digital', 'Binary', 'Hex', 'Octal',
    'Phantom', 'Specter', 'Wraith', 'Reaper', 'Nexus', 'Core', 'Flux',
    'Pulse', 'Wave', 'Signal', 'Noise', 'Data', 'Net', 'Web', 'Cloud',
    'Proxy', 'Tunnel', 'Gateway', 'Router', 'Switch', 'Hub', 'Node',
    'Elite', 'Prime', 'Ultra', 'Mega', 'Giga', 'Tera', 'Peta', 'Exa',
  ],

  strains: [
    'Kush', 'Haze', 'Diesel', 'Skunk', 'Widow', 'Dream', 'Crush', 'Punch',
    'Gelato', 'Cookies', 'Cake', 'Pie', 'Sherbet', 'Sorbet', 'Mint',
    'Berry', 'Cherry', 'Lemon', 'Lime', 'Orange', 'Grape', 'Mango',
    'Pineapple', 'Apple', 'Banana', 'Strawberry', 'Blueberry', 'Raspberry',
    'Purple', 'Blue', 'Green', 'White', 'Black', 'Red', 'Yellow', 'Gold',
    'Silver', 'Platinum', 'Diamond', 'Crystal', 'Amber', 'Ruby', 'Emerald',
    'Sapphire', 'Topaz', 'Onyx', 'Jade', 'Pearl', 'Coral', 'Ivory',
    'Northern', 'Southern', 'Eastern', 'Western', 'Central', 'Arctic',
    'Tropical', 'Alpine', 'Sahara', 'Aurora', 'Cosmic', 'Lunar', 'Solar',
    'Stardust', 'Nebula', 'Galaxy', 'Comet', 'Asteroid', 'Meteor', 'Orbit',
    'Rocket', 'Shuttle', 'Cruiser', 'Falcon', 'Eagle', 'Hawk', 'Raven',
    'Wolf', 'Bear', 'Lion', 'Tiger', 'Dragon', 'Phoenix', 'Griffin',
  ],

  extracts: [
    'Hash', 'Rosin', 'Shatter', 'Wax', 'Oil', 'Butter', 'Crumble', 'Live',
    'Resin', 'Sauce', 'Diamonds', 'Badder', 'Batter', 'Sugar', 'Honey',
    'Jelly', 'Jam', 'Bubble', 'Melt', 'Ice', 'Dry', 'Sift', 'Water',
    'Solvent', 'Solventless', 'Press', 'Cure', 'Caviar', 'Moonrocks',
    'Rick', 'Simpson', 'RSO', 'FECO', 'Distillate', 'Isolate', 'Broad',
    'Full', 'Spectrum', 'Terpene', 'Flavonoid', 'Cannabinoid', 'CBD',
    'THC', 'Delta', 'HHC', 'THCO', 'THCP', 'THCV', 'CBG', 'CBN',
  ],

  suffixes: [
    'Bot', 'Master', 'King', 'Lord', 'God', 'Father', 'System', 'Core',
    'Hub', 'Node', 'Gate', 'Port', 'Host', 'Server', 'Client', 'Agent',
    'Proxy', 'Shell', 'Root', 'Admin', 'User', 'Daemon', 'Service',
  ],

  hackerman: [
    'Elliot', 'Alderson', 'MrRobot', 'Fsociety', 'Darlene', 'Angela',
    'Tyrell', 'Wellick', 'Whiterose', 'Price', 'Ecorp', 'Ecoin',
    'Cisco', 'Roman', 'Letcher', 'Krista', 'Gideon', 'Allsafe',
    'Hackerman', 'Hacker', 'Cracker', 'Script', 'Kiddie', 'Newbie',
    'Exploit', 'Payload', 'Shellcode', 'Backdoor', 'Rootkit', 'Keylogger',
    'Malware', 'Spyware', 'Ransomware', 'Botnet', 'Zombie', 'Drone',
  ],

  groupSuffixes: [
    'HQ', 'Hub', 'Central', 'Command', 'Control', 'Ops', 'Lab', 'Den',
    'Lair', 'Base', 'Station', 'Network', 'Systems', 'Solutions', 'Tech',
  ],
}

/**
 * Get a random element from an array.
 *
 * @param arr - Array to pick from
 * @returns Random element from the array
 */
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/**
 * Generate a random bot username with themed name patterns.
 *
 * @returns A unique bot username ending in 'bot'
 *
 * @example
 * ```typescript
 * const username = generateRandomUsername()
 * // Returns something like 'cyberhashbot' or 'ghostkush123bot'
 * ```
 */
export function generateRandomUsername(): string {
  const { prefixes, strains, extracts, hackerman } = THEME_GENERATORS

  const patterns = [
    () => `${randomFrom(prefixes)}${randomFrom(extracts)}`.toLowerCase(),
    () => `${randomFrom(prefixes)}${randomFrom(strains)}`.toLowerCase(),
    () => `${randomFrom(strains)}${randomFrom(extracts)}`.toLowerCase(),
    () => `${randomFrom(prefixes)}${randomFrom(hackerman)}`.toLowerCase(),
    () => `${randomFrom(extracts)}${randomFrom(hackerman)}`.toLowerCase(),
  ]

  const pattern = randomFrom(patterns)
  let username = pattern()

  if (username.length < 8) {
    username += Math.floor(Math.random() * 999)
  }

  return `${username}bot`
}

/**
 * Generate a display name from a bot username.
 *
 * @param username - Bot username (with or without 'bot' suffix)
 * @returns Human-readable display name
 *
 * @example
 * ```typescript
 * const name = generateBotDisplayname('cyberhashbot')
 * // Returns 'Cyber Hash Bot'
 * ```
 */
export function generateBotDisplayname(username: string): string {
  const base = username.replace(/bot$/, '')
  return base
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/(\d+)/g, ' $1')
    .trim() + ' Bot'
}

/**
 * Generate a random group name.
 *
 * @param _botName - Bot name (unused, kept for API compatibility)
 * @returns Random group name
 *
 * @example
 * ```typescript
 * const groupName = generateGroupName('My Bot')
 * // Returns something like 'CyberKush HQ' or 'QuantumHaze Command'
 * ```
 */
export function generateGroupName(_botName: string): string {
  const { prefixes, strains, groupSuffixes } = THEME_GENERATORS

  const prefix = randomFrom(prefixes)
  const strain = randomFrom(strains)
  const suffix = randomFrom(groupSuffixes)

  return `${prefix}${strain} ${suffix}`
}
