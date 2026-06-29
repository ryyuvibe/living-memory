// Seed interactions. The opener is a FIXED arc so the thesis lands every run:
//   - ACID reinforced repeatedly (revealed + stated) -> climbs to "fairly sure"
//   - SPICE starts as "too spicy" (avoid), then repeated chili-reaching -> FLIPS
//     and announces itself ("you used to avoid heat -> updated...")
//   - SALT gets a single one-off note -> stays "just a guess" (the honest hedge)
//   - FAT forms gradually from butter/richness signals
// After the opener, a larger pool is shuffled so the demo runs longer and feels
// alive — no two runs feed the same order.

// Fixed opening arc — order matters; do not shuffle these.
const OPENER: string[] = [
  "made gochujang thighs tonight, bit salty, I'd make it again",
  "passed the vinegar again, it was missing something bright",
  "that curry was too spicy, had to water it down",
  "added a big splash of lemon at the end, so much better",
  "stirred in a big knob of butter, so silky and rich",
  "squeezed extra lime over the tacos, needed that brightness",
  "reached for the chili crisp again, piled it on",
  "doused the noodles in hot sauce, wanted more heat honestly",
];

// Shuffled pool — keeps each axis getting fresh signals as you keep clicking.
// ~42 lines so the demo runs long; each maps to an ingredient-specific icon.
const POOL: string[] = [
  // acid — lemon / lime / vinegar
  "hit the soup with a splash of vinegar, woke it right up",
  "the dressing needed more lemon, tasted flat without it",
  "grabbed the lime again for the curry, so much brighter",
  "added extra citrus to the marinade, loved the zip",
  "a squeeze of lemon over the fish, that's what it wanted",
  "splashed rice vinegar into the slaw, perfect tang",
  "more lime in the guac, it was begging for acid",
  "finished the lentils with a hit of sherry vinegar",
  "zested a whole lemon into the risotto, so bright",
  "the soup was dull until I added a glug of vinegar",
  // heat / spice — chili crisp / sriracha / hot sauce / cayenne / sambal
  "loaded up the eggs with chili oil this morning",
  "wanted more kick in the chili, added cayenne",
  "the wings weren't spicy enough, doused them in sriracha",
  "reached for the sambal again, piled it on the rice",
  "spooned chili crisp over the dumplings, couldn't stop",
  "shook hot sauce all over the breakfast tacos",
  "stirred gochujang into the glaze, wanted that burn",
  "crushed red pepper flakes on the pizza, more heat",
  "added a second spoon of harissa, loved the fire",
  "the noodles needed sriracha, plain was boring",
  // fat — butter / oil / cream
  "finished the pasta with butter and parmesan, so luscious",
  "drizzled olive oil over everything, wanted that richness",
  "the braise was rich and unctuous, exactly right",
  "added a spoon of creme fraiche, velvety and good",
  "this felt too greasy honestly, lighter next time",
  "swirled a knob of butter into the sauce, silky",
  "poured cream into the mash, decadent and smooth",
  "basted the steak in butter, that richness was perfect",
  "trimmed the fat off this time, felt too heavy before",
  // salt — flaky salt / soy / fish sauce
  "needed salt at the table, finished with flaky salt",
  "the broth was a touch salty but I'd make it again",
  "added more soy at the end, it was missing depth",
  "a few drops of fish sauce and it finally tasted right",
  "sprinkled flaky salt on the cookies, big upgrade",
  "the stew needed seasoning, reached for the soy",
  "topped the eggs with a pinch of sea salt",
  // dishes / vehicles / neutral
  "the roast chicken came out perfect, nailed it",
  "weeknight stir fry, nothing special but solid",
  "scrambled some eggs for dinner, kept it simple",
  "made a big pot of noodle soup, comforting",
  "slow-braised the short ribs all afternoon",
  "threw together a herby green salad, fresh and light",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A fresh queue per session: fixed opener, then a shuffled pool.
export function buildSeedQueue(): string[] {
  return [...OPENER, ...shuffle(POOL)];
}

// Back-compat export: a default queue (opener + shuffled pool) built at import.
export const SEED_LINES: string[] = buildSeedQueue();
