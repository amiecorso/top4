export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
}

export interface GameRound {
  currentPlayer: string;
  ideas: string[];
  playerRanking?: number[]; // Player's own ranking (1-4)
  playerRankings: Record<string, number[]>; // All players' rankings/predictions
  committed: string[]; // Players who have committed their ranking
  revealed: boolean;
  scores: Record<string, number>; // Points scored this round
  voided?: boolean; // Round voided due to turn-taker timeout
  readyForNextRound?: string[]; // Players who are ready for the next round
}

export interface GameRoom {
  id: string;
  code: string;
  players: Record<string, Player>;
  host: string;
  status: "waiting" | "prompt_submission" | "playing" | "finished";
  currentRound: number;
  maxRounds: number;
  rounds: GameRound[];
  ideas: string[];
  usedIdeas: string[];
  selectedCategories: PromptCategoryKey[];
  newPromptPercentage: number;
  requiredPromptsPerPlayer: number;
  playerPrompts: Record<string, string[]>; // playerId -> submitted prompts
  roundDurationSeconds: number; // 0 means no timer
  createdAt: Date;
  promptsReady?: boolean; // true when all players finished submissions; host must start
}

export interface RankingSubmission {
  playerId: string;
  ranking: number[];
}

// Prompt with tags - each prompt can belong to multiple categories
export interface Prompt {
  text: string;
  tags: PromptCategoryKey[];
}

// Category metadata (no longer contains prompts directly)
export interface CategoryMetadata {
  name: string;
}

// All available prompts with their tags
export const PROMPTS: Prompt[] = [
  { text: "the taste of victory", tags: ["abstract", "safeForWork"] },
  { text: "Wilson's sweater game", tags: ["baseAccount", "safeForWork"] },
  {
    text: "Drinking orange juice at 2 p.m.",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "CI fails again", tags: ["baseAccount", "safeForWork"] },
  {
    text: "Meeting during no meeting week",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "Tagging Adam", tags: ["baseAccount", "safeForWork"] },
  { text: "Content coins", tags: ["baseAccount", "safeForWork"] },
  { text: "WalletLink", tags: ["baseAccount", "safeForWork"] },
  { text: "Demo gods are not in your favor", tags: ["baseAccount"] },
  {
    text: "Finding out everyone's heights IRL",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "VGL", tags: ["baseAccount", "safeForWork"] },
  {
    text: "Slack message that says 'can we move this two pixels to the left?'",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "Passkeys", tags: ["baseAccount", "safeForWork"] },
  { text: "Reorg", tags: ["baseAccount", "safeForWork"] },
  { text: "Sunsetting pano", tags: ["baseAccount", "safeForWork"] },
  { text: "Perf review with Eric", tags: ["baseAccount", "safeForWork"] },
  {
    text: "Eric joins your pod stand up",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "Signature validation", tags: ["baseAccount", "safeForWork"] },
  { text: "TBA", tags: ["baseAccount", "safeForWork"] },
  { text: "All day incident", tags: ["baseAccount", "safeForWork"] },
  {
    text: "Winning the hearts and minds of users",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "Warm beer", tags: ["baseAccount", "safeForWork"] },
  { text: "Eric laughing too loud", tags: ["baseAccount", "safeForWork"] },
  { text: "Perfect cursor one shot", tags: ["baseAccount", "safeForWork"] },
  { text: '"Something went wrong" ☹️', tags: ["baseAccount", "safeForWork"] },
  {
    text: "Giving a presentation at the all hands",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "Offsite Eric", tags: ["baseAccount", "safeForWork"] },
  { text: "Parasailing with Chintan", tags: ["baseAccount", "safeForWork"] },
  {
    text: "Getting 10 pages in a single night",
    tags: ["baseAccount", "safeForWork"],
  },
  {
    text: "The Mountain View office, R.I.P.",
    tags: ["baseAccount", "safeForWork"],
  },
  { text: "Shipping", tags: ["baseAccount", "safeForWork"] },
  { text: "Losing your wordle streak", tags: ["safeForWork"] },
  { text: "Throwing shade", tags: ["safeForWork"] },
  { text: "Definitive wins", tags: ["safeForWork", "abstract"] },
  { text: "A phone call from your boss", tags: ["safeForWork"] },
  { text: "Bathroom stall graffiti", tags: ["safeForWork"] },
  {
    text: "People who take a long time to text back",
    tags: ["safeForWork", "romantic"],
  },
  { text: "Drugs", tags: ["inappropriate"] },
  { text: "Your biggest vice", tags: ["inappropriate"] },
  { text: "Living with roommates", tags: ["safeForWork"] },
  { text: "Netflix n' bill", tags: ["safeForWork"] },
  {
    text: "When your friend shares their location with you",
    tags: ["safeForWork"],
  },
  { text: "Responsibility", tags: ["safeForWork", "abstract"] },
  { text: "Party full of people you don't know", tags: ["safeForWork"] },
  { text: "The moment you get into bed", tags: ["safeForWork"] },
  { text: "Doing it right", tags: ["safeForWork"] },
  {
    text: "Something sticky on your sock",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Peeing outside", tags: ["safeForWork"] },
  { text: "Friends dropping by unexpectedly", tags: ["safeForWork"] },
  { text: "Cold plunge", tags: ["safeForWork"] },
  {
    text: "Discovering a really bad dream isn't real",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Shrugging", tags: ["safeForWork"] },
  { text: "Jump scenes", tags: ["safeForWork"] },
  {
    text: "Waking up and realizing you drooled a sweet lil puddle",
    tags: ["safeForWork"],
  },
  { text: "Getting scammed", tags: ["safeForWork"] },
  {
    text: "Waking up to the sound of a mysterious drip",
    tags: ["safeForWork"],
  },
  { text: "Touching the subway handrail", tags: ["safeForWork"] },
  { text: "A dip in a river", tags: ["safeForWork", "kidFriendly"] },
  { text: "A deep sigh", tags: ["safeForWork"] },
  { text: "Overanalyzing", tags: ["safeForWork", "abstract"] },
  { text: "Flying off the handle", tags: ["safeForWork"] },
  { text: "Being soooo grumpy", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Quad shot vanilla lavender 20 ounce breve with cardamom syrup and extra whipped cream",
    tags: ["safeForWork"],
  },
  { text: "Righteous indignation", tags: ["safeForWork", "abstract"] },
  {
    text: "Ice cream cone dripping on your hand",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Identity crisis", tags: ["safeForWork", "abstract"] },
  {
    text: "Revenge dating",
    tags: ["safeForWork", "romantic"],
  },
  { text: "Seafood hangover", tags: ["safeForWork"] },
  { text: "A nice catch", tags: ["safeForWork"] },
  { text: "A medium sized mistake", tags: ["safeForWork"] },
  { text: "Receiving a wet willy", tags: ["safeForWork", "kidFriendly"] },
  { text: "Giving an impromptu speech", tags: ["safeForWork"] },
  { text: "Nice hands", tags: ["safeForWork", "romantic"] },
  {
    text: "Spending an exorbitant amount of money on cheese",
    tags: ["safeForWork"],
  },
  { text: "Selective hearing", tags: ["safeForWork"] },
  { text: "Being held", tags: ["safeForWork", "romantic"] },
  { text: "Moving to a new city", tags: ["safeForWork"] },
  { text: "Traits you inherited from your mom", tags: ["safeForWork"] },
  { text: "Big sneeze", tags: ["safeForWork", "kidFriendly"] },
  { text: "The sound of people chewing", tags: ["safeForWork", "kidFriendly"] },
  {
    text: 'Someone saying "regime" when they mean "regimen"',
    tags: ["safeForWork"],
  },
  {
    text: "Realizing you've had food in your teeth and nobody told you",
    tags: ["safeForWork"],
  },
  { text: "Yahoo search engine", tags: ["safeForWork"] },
  { text: "Oblivion", tags: ["safeForWork", "abstract"] },
  { text: "Extreeeeemely sore calves after a hike", tags: ["safeForWork"] },
  { text: "Unsolicited advice", tags: ["safeForWork"] },
  {
    text: "Getting totally ghosted after five seemingly positive dates",
    tags: ["safeForWork", "romantic"],
  },
  { text: "Running late", tags: ["safeForWork"] },
  {
    text: "Someone insists you never mentioned something you've told them multiple times",
    tags: ["safeForWork"],
  },
  {
    text: "Getting genuinely lost in the woods (scary)",
    tags: ["safeForWork"],
  },
  { text: "Serendipity", tags: ["safeForWork", "abstract"] },
  {
    text: "Acute heartbreak",
    tags: ["safeForWork", "romantic"],
  },
  { text: "Unloading the dishwasher", tags: ["safeForWork"] },
  { text: "Staying up too late", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Having your hair washed by someone else",
    tags: ["safeForWork", "romantic"],
  },
  {
    text: "Accidentally using your ex's name",
    tags: ["safeForWork", "romantic", "inappropriate"],
  },
  { text: "Being mean and then regretting it", tags: ["safeForWork"] },
  { text: "Being center of attention", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Winking at strangers",
    tags: ["safeForWork", "romantic"],
  },
  { text: "A hole in your sock", tags: ["safeForWork", "kidFriendly"] },
  { text: "Forgetting someone's name", tags: ["safeForWork"] },
  { text: "First world problems", tags: ["safeForWork"] },
  { text: "Choosing a seat on a crowded bus", tags: ["safeForWork"] },
  { text: "First week of a new job", tags: ["safeForWork"] },
  {
    text: "Your clothes all smell like the dinner you cooked",
    tags: ["safeForWork"],
  },
  { text: "A very good dream", tags: ["safeForWork"] },
  { text: "Feeling self-conscious", tags: ["safeForWork"] },
  { text: "Multiple major life changes all at once", tags: ["safeForWork"] },
  { text: "The smell of wet dog", tags: ["safeForWork", "kidFriendly"] },
  { text: "Taking a personality test", tags: ["safeForWork"] },
  { text: "Playing it by ear", tags: ["safeForWork", "abstract"] },
  { text: "Bad first kiss with your crush", tags: ["safeForWork", "romantic"] },
  { text: "Cold ocean air", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Dreamin' and schemin'",
    tags: ["safeForWork", "abstract", "kidFriendly"],
  },
  { text: "Karmic revenge", tags: ["safeForWork", "abstract"] },
  {
    text: "Getting a compliment about something you were feeling self-conscious about",
    tags: ["safeForWork"],
  },
  { text: "An awkward first date", tags: ["safeForWork", "romantic"] },
  { text: "Getting away with it", tags: ["safeForWork", "kidFriendly"] },
  { text: "Doubling down", tags: ["safeForWork", "abstract"] },
  { text: "Killing people you hate with kindness", tags: ["safeForWork"] },
  {
    text: "Overeating by 20% because it was so delicious",
    tags: ["safeForWork"],
  },
  { text: "Strange visions", tags: ["safeForWork"] },
  {
    text: 'When people use "then" when they really mean "than"',
    tags: ["safeForWork"],
  },
  { text: "Death by 1,000 cuts", tags: ["safeForWork", "abstract"] },
  { text: "Forgiving someone", tags: ["safeForWork"] },
  { text: "Burning bridges", tags: ["safeForWork", "abstract"] },
  {
    text: "Russian roulette but with fish tacos, 1 out of 6 is bad",
    tags: ["safeForWork"],
  },
  { text: "3-hour YouTube wormhole", tags: ["safeForWork"] },
  { text: "Getting yourself a neck tattoo", tags: ["safeForWork"] },
  { text: "Good dog lick on the face", tags: ["safeForWork", "kidFriendly"] },
  { text: "Crying", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Learning the hard way",
    tags: ["safeForWork", "abstract", "kidFriendly"],
  },
  {
    text: "Realizing you're in love with a platonic friend",
    tags: ["safeForWork", "romantic"],
  },
  { text: "Realizing you're being a hypocrite", tags: ["safeForWork"] },
  {
    text: "Getting three hours of sleep",
    tags: ["safeForWork", "kidFriendly"],
  },
  {
    text: "When the good guys win",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Yelling", tags: ["safeForWork", "kidFriendly"] },
  { text: "Forgetting your phone at home", tags: ["safeForWork"] },
  { text: "Your comfiest pants", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Being aware you are in a dream while you are dreaming",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Fear of death", tags: ["safeForWork", "abstract"] },
  { text: "Retail therapy", tags: ["safeForWork"] },
  { text: '"..." popping up in iMessage', tags: ["safeForWork"] },
  { text: "Going to therapy", tags: ["safeForWork"] },
  { text: "Emergency Red Bull", tags: ["safeForWork"] },
  { text: "Change", tags: ["safeForWork", "abstract"] },
  { text: "Double stuffed Oreos", tags: ["safeForWork", "kidFriendly"] },
  { text: "Ability to forget", tags: ["safeForWork", "abstract"] },
  { text: "Going to a new hair stylist", tags: ["safeForWork"] },
  {
    text: "No toilet paper but you need to poop",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Unexpected guests", tags: ["safeForWork", "kidFriendly"] },
  { text: "Basking in glory", tags: ["safeForWork", "abstract"] },
  { text: "Petty theft for thrills", tags: ["safeForWork", "inappropriate"] },
  { text: "Brain fog", tags: ["safeForWork"] },
  { text: "Sinking to their level", tags: ["safeForWork"] },
  { text: "Stepping on a crunchy leaf", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Selling stuff on Facebook Marketplace",
    tags: ["safeForWork"],
  },
  { text: "Second chances", tags: ["safeForWork", "abstract"] },
  { text: "Wheelin' and dealin'", tags: ["safeForWork", "nonsense"] },
  {
    text: "Having to speak like Elmo 24-7 for the rest of your life",
    tags: ["safeForWork"],
  },
  { text: "Losing trust", tags: ["safeForWork", "abstract"] },
  { text: "Tasting power", tags: ["safeForWork", "abstract"] },
  { text: "Blooming late", tags: ["safeForWork", "abstract"] },
  {
    text: "Getting upgraded to first class unexpectedly due to airline seating error",
    tags: ["safeForWork"],
  },
  {
    text: "Raw-dogging it on the airplane",
    tags: ["safeForWork", "inappropriate"],
  },
  { text: "Shakin' it", tags: ["safeForWork"] },
  { text: "Lying to protect someone", tags: ["safeForWork"] },
  {
    text: "Jolting awake feeling as if you were falling while falling asleep",
    tags: ["safeForWork", "kidFriendly"],
  },
  {
    text: "Forgetting to take the trash out on garbage day",
    tags: ["safeForWork"],
  },
  {
    text: 'Any mix-up of "their", "there", or "they\'re"',
    tags: ["safeForWork"],
  },
  { text: "Cheeto fingers", tags: ["safeForWork", "kidFriendly"] },
  { text: "Waking up from a weird nap", tags: ["safeForWork", "kidFriendly"] },
  { text: "Feeling disappointed", tags: ["safeForWork", "abstract"] },
  { text: "Awkward silences", tags: ["safeForWork"] },
  {
    text: "Biting and snuffling",
    tags: ["romantic"],
  },
  { text: "Waking up at 6 a.m. naturally", tags: ["safeForWork"] },
  { text: "Being brutally honest", tags: ["safeForWork"] },
  { text: "The meat sweats", tags: ["safeForWork"] },
  { text: "Going with the flow", tags: ["safeForWork", "abstract"] },
  { text: "Giving a shit", tags: ["safeForWork", "abstract"] },
  { text: "A perfect cappuccino", tags: ["safeForWork"] },
  { text: "Mismatched socks", tags: ["safeForWork", "kidFriendly"] },
  { text: "Triple penetration", tags: ["inappropriate"] },
  {
    text: "Being able to see the future on demand",
    tags: ["safeForWork", "abstract", "kidFriendly"],
  },
  { text: "Collaboration", tags: ["safeForWork", "abstract"] },
  { text: "Venom nail polish", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Eavesdropping and hearing some juicy tea",
    tags: ["safeForWork"],
  },
  { text: "The land of milf and honey", tags: ["inappropriate"] },
  {
    text: "Pizza shops that put crayons out on the tables",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Writing thank you notes", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Being neutrally buoyant i.e. you neither float nor sink in water",
    tags: ["safeForWork"],
  },
  { text: "Riding a horse", tags: ["safeForWork", "kidFriendly"] },
  { text: "Giving a dog a bath", tags: ["safeForWork", "kidFriendly"] },
  { text: "Meeting the family", tags: ["safeForWork", "romantic"] },
  { text: "Being made a villain or a scapegoat", tags: ["safeForWork"] },
  { text: "Feeling indifferent", tags: ["safeForWork"] },
  { text: "Luscious locks", tags: ["safeForWork", "romantic"] },
  { text: "A stone in your shoe", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "The first bad sunburn of the summer",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Shower sex", tags: ["inappropriate"] },
  { text: "Quarter life crisis", tags: ["safeForWork"] },
  { text: "Stepping in poo", tags: ["safeForWork", "kidFriendly"] },
  { text: "Feeling regret", tags: ["safeForWork"] },
  { text: "Crying in the shower", tags: ["safeForWork"] },
  { text: "Obvious hickey", tags: ["inappropriate", "romantic"] },
  { text: "Hospitals", tags: ["safeForWork"] },
  { text: "When the juice is flowin", tags: ["safeForWork"] },
  { text: "Eye crusties", tags: ["safeForWork", "kidFriendly"] },
  { text: 'Sitting next to a "talker" at the bar', tags: ["safeForWork"] },
  { text: "Living forever", tags: ["safeForWork", "abstract"] },
  { text: "Pollen", tags: ["safeForWork", "kidFriendly"] },
  { text: "Sweating", tags: ["safeForWork"] },
  { text: "Being 24", tags: ["safeForWork"] },
  { text: "Earning a gold star", tags: ["safeForWork", "kidFriendly"] },
  { text: "When you get too high at a wedding", tags: ["inappropriate"] },
  {
    text: "Cheating on your diet with something delicious",
    tags: ["safeForWork"],
  },
  {
    text: "Biking 100 miles all downhill, slight decline",
    tags: ["safeForWork"],
  },
  {
    text: "Performing a song in front of a large audience",
    tags: ["safeForWork", "kidFriendly"],
  },
  {
    text: "The first bite of the treat you bought for yourself",
    tags: ["safeForWork", "kidFriendly"],
  },
  {
    text: "Taking a risk and actually being successful",
    tags: ["safeForWork", "abstract"],
  },
  { text: "Being stuck at home", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "When your favorite song plays on the radio",
    tags: ["safeForWork"],
  },
  {
    text: "A light touch that makes your arm hairs stand up",
    tags: ["safeForWork", "romantic"],
  },
  {
    text: "Chirpin' and burpin'",
    tags: ["safeForWork", "kidFriendly", "nonsense"],
  },
  { text: "Job performance review coming up", tags: ["safeForWork"] },
  {
    text: "Standing up to your childhood bully",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Making sweet, sweet love", tags: ["inappropriate", "romantic"] },
  {
    text: "Accidentally killing your favorite houseplant",
    tags: ["safeForWork"],
  },
  {
    text: "Ear kisses / someone putting your earlobe in their mouth",
    tags: ["romantic", "inappropriate"],
  },
  { text: "Cuck whale", tags: ["inappropriate"] },
  { text: "Making lists", tags: ["safeForWork"] },
  { text: "Losing at board games", tags: ["safeForWork", "kidFriendly"] },
  { text: "A surprise party in your honor", tags: ["safeForWork"] },
  { text: "Crossing the last item off your to-do list", tags: ["safeForWork"] },
  { text: "Raising the bar", tags: ["safeForWork", "abstract"] },
  {
    text: "Peanut butter, pickles, mayo sandwich",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "A gritty smoothie", tags: ["safeForWork", "kidFriendly"] },
  { text: "Shower head", tags: ["romantic", "inappropriate"] },
  { text: "Social security benefits", tags: ["safeForWork"] },
  {
    text: "Opening a present that you really don't like in front of the giver",
    tags: ["safeForWork"],
  },
  { text: "Taking a bath", tags: ["safeForWork", "kidFriendly"] },
  { text: "Crazy chemistry", tags: ["romantic"] },
  { text: "Friday deploys", tags: ["safeForWork", "baseAccount"] },
  { text: "Facial hair", tags: ["safeForWork"] },
  { text: "Western medicine", tags: ["safeForWork"] },
  { text: "Being a diva", tags: ["safeForWork"] },
  {
    text: "Being part of the first space colony",
    tags: ["safeForWork"],
  },
  {
    text: "Listening to wellness podcasts",
    tags: ["safeForWork"],
  },
  { text: "Temps above 90 degrees", tags: ["safeForWork"] },
  {
    text: "Your dog gains the ability to speak, but their voice is extremely annoying",
    tags: ["safeForWork", "nonsense", "kidFriendly"],
  },
  { text: "Waking up and you're still high", tags: ["inappropriate"] },
  { text: "Riding on the roof of a car", tags: ["safeForWork"] },
  { text: "Lukewarm coffee", tags: ["safeForWork"] },
  { text: "Being 'normal'", tags: ["safeForWork", "abstract"] },
  { text: "Getting a mani-pedi", tags: ["safeForWork"] },
  { text: "Digging your hands in dirt", tags: ["safeForWork", "kidFriendly"] },
  { text: "Speeding", tags: ["safeForWork"] },
  { text: "Guilty dog faces", tags: ["safeForWork", "kidFriendly"] },
  { text: "Forgetting how to do your job", tags: ["safeForWork"] },
  { text: "Nudes of your besties", tags: ["inappropriate"] },
  { text: "A big group campsite", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "A review of a favorite book/movie that you totally disagree with",
    tags: ["safeForWork"],
  },
  {
    text: "Finding money in your pocket after doing laundry",
    tags: ["safeForWork"],
  },
  { text: "Being mistaken for Gen Z", tags: ["safeForWork"] },
  { text: "A hat when the sun is in your eyes", tags: ["safeForWork"] },
  { text: "Finding a bargain", tags: ["safeForWork"] },
  { text: "Feeling seen", tags: ["safeForWork", "abstract"] },
  { text: "A blister", tags: ["safeForWork"] },
  {
    text: "Four missed calls from loved ones when you look at your phone",
    tags: ["safeForWork"],
  },
  { text: "Talking with strangers at a party", tags: ["safeForWork"] },
  { text: "Strap-ons", tags: ["inappropriate"] },
  { text: "A surprise day off of work", tags: ["safeForWork"] },
  { text: "A grand spagurtti squanch", tags: ["safeForWork", "nonsense"] },
  {
    text: "Accidentally biting your tongue while eating food",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Commercial integrity", tags: ["safeForWork", "abstract"] },
  { text: "Slime", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "A six-hour flight with constant turbulence",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Overripe bananas", tags: ["safeForWork", "kidFriendly"] },
  { text: "Chewing gum", tags: ["safeForWork", "kidFriendly"] },
  { text: "Decorating for the holidays", tags: ["safeForWork", "kidFriendly"] },
  { text: "Extra mayo", tags: ["safeForWork", "kidFriendly"] },
  { text: "Giant zit", tags: ["safeForWork", "kidFriendly"] },
  { text: "Inheritance of millions", tags: ["safeForWork"] },
  { text: "A party that goes too late", tags: ["safeForWork"] },
  {
    text: "Warming your hands on someone's belly",
    tags: ["safeForWork", "romantic"],
  },
  { text: "Getting a new bike", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Great first kiss with your crush",
    tags: ["safeForWork", "romantic"],
  },
  {
    text: "Finding your leftovers have already been eaten",
    tags: ["safeForWork"],
  },
  { text: "An overconfident friend", tags: ["safeForWork"] },
  { text: "Telling a white lie", tags: ["safeForWork"] },
  { text: "Spying on people", tags: ["safeForWork", "kidFriendly"] },
  { text: "Dog barking all night", tags: ["safeForWork", "kidFriendly"] },
  { text: "Euphemisms", tags: ["safeForWork", "abstract"] },
  { text: "Holding a hedgehog", tags: ["safeForWork", "kidFriendly"] },
  {
    text: "Having to watch Sesame Street while babysitting",
    tags: ["safeForWork", "kidFriendly"],
  },
  { text: "Farting in front of your crush", tags: ["safeForWork", "romantic"] },
  { text: "Playing hooky", tags: ["safeForWork"] },
  {
    text: "Leftovers fitting perfectly into the first Tupperware you choose",
    tags: ["safeForWork"],
  },
  {
    text: "Zoom camera accidentally on when you thought it wasn’t",
    tags: ["safeForWork"],
  },
  {
    text: 'replying "sounds good" to a thread you didn’t fully read',
    tags: ["safeForWork"],
  },
  {
    text: "using a fancy word and then immediately doubting you know what it means",
    tags: ["safeForWork"],
  },
  {
    text: "realizing you weren't muted while cooking lunch on a huge meeting",
    tags: ["safeForWork", "baseAccount"],
  },
  {
    text: "Pepe emojis",
    tags: ["safeForWork", "baseAccount"],
  },
  { text: "silent battle over thermostat temperature", tags: ["safeForWork"] },
  {
    text: "accidentally committing to the wrong branch",
    tags: ["safeForWork", "baseAccount"],
  },
  { text: "having standards", tags: ["abstract", "safeForWork"] },
  { text: "mixed signals", tags: ["abstract", "safeForWork"] },
  { text: "taking the high road", tags: ["abstract", "safeForWork"] },
  { text: "lowering the bar", tags: ["abstract", "safeForWork"] },
  { text: "picking your battles", tags: ["abstract", "safeForWork"] },
  { text: "following your gut", tags: ["abstract", "safeForWork"] },
  { text: "overthinking it", tags: ["abstract", "safeForWork"] },
  { text: "reading between the lines", tags: ["abstract", "safeForWork"] },
  { text: "holding your tongue", tags: ["abstract", "safeForWork"] },
  { text: "knowing your limits", tags: ["abstract", "safeForWork"] },
  { text: "setting a boundary", tags: ["abstract", "safeForWork"] },
  { text: "being the bigger person", tags: ["abstract", "safeForWork"] },
  { text: "making a scene", tags: ["abstract", "safeForWork"] },
  { text: "taking things personally", tags: ["abstract", "safeForWork"] },
  { text: "letting it slide", tags: ["abstract", "safeForWork"] },
  { text: "playing it safe", tags: ["abstract", "safeForWork"] },
  { text: "raising your standards", tags: ["abstract", "safeForWork"] },
  { text: "staying neutral", tags: ["abstract", "safeForWork"] },
  { text: "leaving it unfinished", tags: ["abstract", "safeForWork"] },
  { text: "changing your mind", tags: ["abstract", "safeForWork"] },
  { text: "getting ahead of yourself", tags: ["abstract", "safeForWork"] },
  { text: "calling it early", tags: ["abstract", "safeForWork"] },
  { text: "losing your cool", tags: ["abstract", "safeForWork"] },
  {
    text: "playing hard to get",
    tags: ["abstract", "safeForWork", "romantic"],
  },
  { text: "being in the moment", tags: ["abstract", "safeForWork"] },
  { text: "stirring the pot", tags: ["abstract", "safeForWork"] },
  { text: "missing the point", tags: ["abstract", "safeForWork"] },
  { text: "trusting the process", tags: ["abstract", "safeForWork"] },
  {
    text: "sending mixed messages",
    tags: ["abstract", "safeForWork", "romantic"],
  },
  { text: "going out on a limb", tags: ["abstract", "safeForWork"] },
  { text: "setting the tone", tags: ["abstract", "safeForWork"] },
  { text: "correctly reading the room", tags: ["abstract", "safeForWork"] },
  { text: "crossing a line", tags: ["abstract", "safeForWork"] },
  { text: "looking the other way", tags: ["abstract", "safeForWork"] },
  { text: "hedging your bets", tags: ["abstract", "safeForWork"] },
  { text: "pushing your luck", tags: ["abstract", "safeForWork"] },
  { text: "breaking the ice", tags: ["abstract", "safeForWork"] },
  { text: "holding your ground", tags: ["abstract", "safeForWork"] },
  { text: "keeping your distance", tags: ["abstract", "safeForWork"] },
  { text: "taking a hint", tags: ["abstract", "safeForWork"] },
  { text: "sip n' flip", tags: ["nonsense", "safeForWork"] },
  { text: "chillin' and spillin'", tags: ["nonsense", "safeForWork"] },
  {
    text: "snacks and facts",
    tags: ["nonsense", "safeForWork", "kidFriendly"],
  },
  {
    text: "boopin' and snoopin'",
    tags: ["nonsense", "safeForWork", "kidFriendly"],
  },
  { text: "wishful sinking", tags: ["nonsense", "safeForWork"] },
  {
    text: "putting your ducks in a loose formation",
    tags: ["nonsense", "safeForWork"],
  },
  { text: "burning the candle at one end", tags: ["nonsense", "safeForWork"] },
  {
    text: "mumbo jumbo",
    tags: ["nonsense", "safeForWork", "abstract", "kidFriendly"],
  },
  { text: "having a package stolen off your porch", tags: ["safeForWork"] },
  { text: "vibin’ and thrivin’", tags: ["nonsense", "safeForWork"] },
  {
    text: "emptying the lint trap in the dryer in one big layer",
    tags: ["safeForWork"],
  },
  {
    text: "sending a risky text you immediately regret",
    tags: ["inappropriate", "romantic"],
  },
  {
    text: "accidentally sexting the wrong person",
    tags: ["inappropriate", "romantic"],
  },
  {
    text: "texting your partner a pet name goodnight but you actually texted your mom",
    tags: ["romantic"],
  },
  { text: "walking in on your roommate", tags: ["inappropriate"] },
  {
    text: "eye contact that lasts just a little too long",
    tags: ["romantic"],
  },
  {
    text: "being constantly interrupted in conversation",
    tags: ["safeForWork"],
  },
  {
    text: "noisy group chat that you can't leave or mute",
    tags: ["safeForWork"],
  },
  {
    text: "getting stuck in an elevator alone",
    tags: ["safeForWork"],
  },
  {
    text: 'a "we need to talk" with zero context',
    tags: ["safeForWork", "romantic"],
  },
  {
    text: "slow walkers",
    tags: ["safeForWork"],
  },
  {
    text: '"We should totally hang out sometime!" but you know you never will',
    tags: ["safeForWork"],
  },
  {
    text: "being asked a question immediately after taking a huge bite of food",
    tags: ["safeForWork"],
  },
  {
    text: "someone repeating your idea back to you like it's theirs",
    tags: ["safeForWork"],
  },
  {
    text: "forgetting what you actually walked into the room for",
    tags: ["safeForWork"],
  },
  {
    text: "when your washer/dryer sings a long, horrible song when it's finished running",
    tags: ["safeForWork"],
  },
  {
    text: "someone replying to only half of your message",
    tags: ["safeForWork"],
  },
  {
    text: "when the audience claps at the end of a movie in the theater",
    tags: ["safeForWork"],
  },
  {
    text: "someone calling you immediately after you text them",
    tags: ["safeForWork"],
  },
  {
    text: "when people stop talking right after you enter the room",
    tags: ["safeForWork"],
  },
  { text: "a friend who is literally always late", tags: ["safeForWork"] },
  { text: "getting stuck with a bad nickname", tags: ["safeForWork"] },
  { text: "inviting yourself to an event", tags: ["safeForWork"] },
  {
    text: "when someone says 'you look tired' instead of hello",
    tags: ["safeForWork"],
  },
  {
    text: "waving back at someone who wasn’t waving at you",
    tags: ["safeForWork"],
  },
  {
    text: "your stomach growling loudly during a quiet moment",
    tags: ["safeForWork"],
  },
  {
    text: "saying goodbye and then walking in the same direction",
    tags: ["safeForWork"],
  },
  {
    text: "holding the door for someone farther away than you planned",
    tags: ["safeForWork"],
  },
  { text: "pulling on a push door in front of people", tags: ["safeForWork"] },
  {
    text: "Zoom asking you to update when you're already late for a meeting",
    tags: ["safeForWork"],
  },
  {
    text: "getting left on read after a vulnerable message",
    tags: ["safeForWork", "romantic"],
  },
];

// Helper function: Get prompts that match ANY of the selected tags (union/OR logic)
export function getPromptsByTags(selectedTags: PromptCategoryKey[]): string[] {
  if (selectedTags.length === 0) return [];
  return PROMPTS.filter((prompt) =>
    prompt.tags.some((tag) => selectedTags.includes(tag))
  ).map((prompt) => prompt.text);
}

// Define category keys first to avoid circular reference
export type PromptCategoryKey =
  | "safeForWork"
  | "romantic"
  | "kidFriendly"
  | "baseAccount"
  | "nonsense"
  | "abstract"
  | "inappropriate";

// Category metadata (for UI display)
export const PROMPT_CATEGORIES: Record<PromptCategoryKey, CategoryMetadata> = {
  kidFriendly: {
    name: "👦🏻 Kid-Friendly",
  },
  safeForWork: {
    name: "👍 Safe for Work",
  },
  baseAccount: {
    name: "🔵 Base Account",
  },
  abstract: {
    name: "💭 Abstract",
  },
  romantic: {
    name: "💖 Romantic",
  },
  nonsense: {
    name: "🤪 Nonsense",
  },
  inappropriate: {
    name: "🚫 Inappropriate",
  },
} as const;

// Helper to get prompt count for a category (for UI display)
export function getPromptCountForCategory(
  categoryKey: PromptCategoryKey
): number {
  return PROMPTS.filter((prompt) => prompt.tags.includes(categoryKey)).length;
}

export const DEFAULT_IDEAS = getPromptsByTags(["kidFriendly"]);

export type GamePhase =
  | "lobby"
  | "ranking"
  | "waiting"
  | "reveal"
  | "scores"
  | "finished";
