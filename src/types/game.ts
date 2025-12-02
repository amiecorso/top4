export interface Player {
  id: string
  name: string
  score: number
  isConnected: boolean
}

export interface GameRound {
  currentPlayer: string
  ideas: string[]
  playerRanking?: number[] // Player's own ranking (1-4)
  playerRankings: Record<string, number[]> // All players' rankings/predictions
  committed: string[] // Players who have committed their ranking
  revealed: boolean
  scores: Record<string, number> // Points scored this round
  voided?: boolean // Round voided due to turn-taker timeout
}

export interface GameRoom {
  id: string
  code: string
  players: Record<string, Player>
  host: string
  status: 'waiting' | 'prompt_submission' | 'playing' | 'finished'
  currentRound: number
  maxRounds: number
  rounds: GameRound[]
  ideas: string[]
  usedIdeas: string[]
  selectedCategories: PromptCategoryKey[]
  newPromptPercentage: number
  requiredPromptsPerPlayer: number
  playerPrompts: Record<string, string[]> // playerId -> submitted prompts
  roundDurationSeconds: number // 0 means no timer
  createdAt: Date
  promptsReady?: boolean // true when all players finished submissions; host must start
}

export interface RankingSubmission {
  playerId: string
  ranking: number[]
}

// Prompt with tags - each prompt can belong to multiple categories
export interface Prompt {
  text: string
  tags: PromptCategoryKey[]
}

// Category metadata (no longer contains prompts directly)
export interface CategoryMetadata {
  name: string
}

// All available prompts with their tags
export const PROMPTS: Prompt[] = [
  { text: "building the tallest pillow fort", tags: ["kidFriendly"] },
  { text: "first day at a new school", tags: ["kidFriendly"] },
  { text: "winning a tiny prize at the fair", tags: ["kidFriendly"] },
  { text: "secret handshake with your best friend", tags: ["kidFriendly"] },
  { text: "finding a rainbow after the storm", tags: ["kidFriendly"] },
  { text: "the last slice of birthday cake", tags: ["kidFriendly"] },
  { text: "teaching a pet a new trick", tags: ["kidFriendly"] },
  { text: "splashing in puddles with boots", tags: ["kidFriendly"] },
  { text: "trading snacks at lunch", tags: ["kidFriendly"] },
  { text: "reading under a blanket with a flashlight", tags: ["kidFriendly"] },
  { text: "riding the biggest slide at the park", tags: ["kidFriendly"] },
  { text: "snowman that keeps falling over", tags: ["kidFriendly"] },
  { text: "catching fireflies in a jar", tags: ["kidFriendly"] },
  { text: "bikes with streamers on the handles", tags: ["kidFriendly"] },
  { text: "drawing with sidewalk chalk", tags: ["kidFriendly"] },
  { text: "hide-and-seek where nobody can find you", tags: ["kidFriendly"] },
  { text: "perfectly timed coffee break", tags: ["safeForWork"] },
  { text: "the meeting that could be an email", tags: ["safeForWork"] },
  { text: "pair programming that actually clicks", tags: ["safeForWork"] },
  { text: "naming things (the real hard problem)", tags: ["safeForWork"] },
  { text: "the calendar invite with no agenda", tags: ["safeForWork"] },
  { text: "quiet focus time with noise-cancelling on", tags: ["safeForWork"] },
  { text: "merging a PR on the first review", tags: ["safeForWork"] },
  { text: "laptop about to die during a call", tags: ["safeForWork"] },
  { text: "Slack huddles that never end", tags: ["safeForWork"] },
  { text: "the office plant that refuses to die", tags: ["safeForWork"] },
  { text: "ending the week with inbox zero", tags: ["safeForWork"] },
  { text: "free snacks you pretend not to care about", tags: ["safeForWork"] },
  { text: "standing desk that keeps sinking", tags: ["safeForWork"] },
  { text: "last-minute production hotfix", tags: ["safeForWork"] },
  { text: "Friday deploys (are you brave?)", tags: ["safeForWork"] },
  { text: "remembering where you left your headphones", tags: ["safeForWork"] },
  { text: "arguing with a goose about rent", tags: ["nonsense"] },
  { text: "left sock forming a union", tags: ["nonsense"] },
  { text: "a sandwich that files taxes", tags: ["nonsense"] },
  { text: "gravity taking a personal day", tags: ["nonsense"] },
  { text: "screaming into a jar of mayonnaise", tags: ["nonsense"] },
  { text: "banana that critiques modern art", tags: ["nonsense"] },
  { text: "the moon asking for a refund", tags: ["nonsense"] },
  { text: "dolphins running a startup", tags: ["nonsense"] },
  { text: "time traveling through a nap", tags: ["nonsense"] },
  { text: "a toaster with stage fright", tags: ["nonsense"] },
  { text: "alphabet soup spelling spoilers", tags: ["nonsense"] },
  { text: "staircase with commitment issues", tags: ["nonsense"] },
  { text: "clouds attending book club", tags: ["nonsense"] },
  { text: "a spoon that longs to be a fork", tags: ["nonsense"] },
  { text: "traffic cone with big dreams", tags: ["nonsense"] },
  { text: "calendar that forgets weekends", tags: ["nonsense"] },
  { text: "the taste of victory", tags: ["abstract"] },
  { text: "memories shaped like paper cranes", tags: ["abstract"] },
  { text: "time as a hallway of open doors", tags: ["abstract"] },
  { text: "silence that hums like neon", tags: ["abstract"] },
  { text: "regret folded into an origami star", tags: ["abstract"] },
  { text: "hope in the pockets of a worn coat", tags: ["abstract"] },
  { text: "echoes that learn your name", tags: ["abstract"] },
  { text: "a sunrise that refuses to end", tags: ["abstract"] },
  { text: "laughter hiding under the floorboards", tags: ["abstract"] },
  { text: "gravity as a gentle suggestion", tags: ["abstract"] },
  { text: "a conversation with your future shadow", tags: ["abstract"] },
  { text: "patience growing like ivy", tags: ["abstract"] },
  { text: "dreams that leak into Tuesday", tags: ["abstract"] },
  { text: "a map with no north and many homes", tags: ["abstract"] },
  { text: "raindrops rehearsing their entrance", tags: ["abstract"] },
  { text: "footsteps that arrive before you do", tags: ["abstract"] },
  { text: "Wilson's sweater game", tags: ["baseAccount"] },
  { text: "Drinking orange juice at 2 p.m.", tags: ["baseAccount"] },
  { text: "CI fails again", tags: ["baseAccount"] },
  { text: "Meeting during no meeting week", tags: ["baseAccount"] },
  { text: "Tagging Adam", tags: ["baseAccount"] },
  { text: "Content coins", tags: ["baseAccount"] },
  { text: "WalletLink", tags: ["baseAccount"] },
  { text: "Demo gods are not in your favor", tags: ["baseAccount"] },
  { text: "Finding out everyone's heights IRL", tags: ["baseAccount"] },
  { text: "VGL", tags: ["baseAccount"] },
  { text: "Slack message that says \"can we move this two pixels to the left?\"", tags: ["baseAccount"] },
  { text: "Passkeys", tags: ["baseAccount"] },
  { text: "Reorg", tags: ["baseAccount"] },
  { text: "Sunsetting pano", tags: ["baseAccount"] },
  { text: "\"Quick 15-minute huddle\" with Eric at 4 p.m. on a Friday", tags: ["baseAccount"] },
  { text: "Perf review with Eric", tags: ["baseAccount"] },
  { text: "Being responsible for aux", tags: ["baseAccount"] },
  { text: "Eric joins your pod stand up", tags: ["baseAccount"] },
  { text: "Signature validation", tags: ["baseAccount"] },
  { text: "TBA", tags: ["baseAccount"] },
  { text: "All day incident", tags: ["baseAccount"] },
  { text: "Winning the hearts and minds of users", tags: ["baseAccount"] },
  { text: "Warm beer", tags: ["baseAccount"] },
  { text: "Eric laughing too loud", tags: ["baseAccount"] },
  { text: "Perfect cursor one shot", tags: ["baseAccount"] },
  { text: "\"Something went wrong\" ☹️", tags: ["baseAccount"] },
  { text: "Giving a presentation at the all hands", tags: ["baseAccount"] },
  { text: "Offsite Eric", tags: ["baseAccount"] },
  { text: "Parasailing with Chintan", tags: ["baseAccount"] },
  { text: "Getting 10 pages in a single night", tags: ["baseAccount"] },
  { text: "The Mountain View office", tags: ["baseAccount"] },
  { text: "Shipping", tags: ["baseAccount"] },
  { text: "Losing your wordle streak", tags: ["safeForWork", "popCulture"] },
  { text: "Throwing shade", tags: ["safeForWork", "popCulture"] },
  { text: "Definitive wins", tags: ["safeForWork", "abstract"] },
  { text: "A phone call from your boss", tags: ["safeForWork"] },
  { text: "Bathroom stall graffiti", tags: ["safeForWork", "inappropriate"] },
  { text: "People who take a long time to text back", tags: ["safeForWork", "romantic"] },
  { text: "Drugs", tags: ["safeForWork", "inappropriate"] },
  { text: "Your biggest vice", tags: ["safeForWork", "inappropriate"] },
  { text: "Living with roommates", tags: ["safeForWork"] },
  { text: "Netflix n' bill", tags: ["safeForWork", "popCulture"] },
  { text: "When your friend shares their location with you", tags: ["safeForWork"] },
  { text: "Responsibility", tags: ["safeForWork", "abstract"] },
  { text: "Party full of people you don't know", tags: ["safeForWork"] },
  { text: "The moment you get into bed", tags: ["safeForWork", "romantic"] },
  { text: "Doing it right", tags: ["safeForWork", "inappropriate"] },
  { text: "Something sticky on your sock", tags: ["safeForWork"] },
  { text: "Peeing outside", tags: ["safeForWork", "inappropriate"] },
  { text: "Friends dropping by unexpectedly", tags: ["safeForWork"] },
  { text: "Cold plunge", tags: ["safeForWork"] },
  { text: "Discovering a really bad dream isn't real", tags: ["safeForWork", "abstract"] },
  { text: "Shrugging", tags: ["safeForWork"] },
  { text: "Jump scenes", tags: ["safeForWork", "popCulture"] },
  { text: "Waking up and realizing you drooled a sweet lil puddle", tags: ["safeForWork"] },
  { text: "Getting scammed", tags: ["safeForWork"] },
  { text: "Waking up to the sound of a mysterious drip", tags: ["safeForWork"] },
  { text: "Touching the subway handrail", tags: ["safeForWork"] },
  { text: "A dip in a river", tags: ["safeForWork"] },
  { text: "A deep sigh", tags: ["safeForWork", "abstract"] },
  { text: "Overanalyzing", tags: ["safeForWork"] },
  { text: "Flying off the handle", tags: ["safeForWork"] },
  { text: "Being SOO grumpy", tags: ["safeForWork"] },
  { text: "Quad shot vanilla lavender 20 ounce breve with cardamom syrup and extra whipped cream", tags: ["safeForWork", "nonsense"] },
  { text: "Righteous indignation", tags: ["safeForWork", "abstract"] },
  { text: "Ice cream cone dripping on your hand", tags: ["safeForWork"] },
  { text: "Identity crisis", tags: ["safeForWork", "abstract"] },
  { text: "Revenge dating", tags: ["safeForWork", "romantic", "inappropriate"] },
  { text: "Seafood hangover", tags: ["safeForWork"] },
  { text: "A nice catch", tags: ["safeForWork"] },
  { text: "A medium sized mistake", tags: ["safeForWork"] },
  { text: "Receiving a wet willy", tags: ["safeForWork", "inappropriate"] },
  { text: "Giving an impromptu speech", tags: ["safeForWork"] },
  { text: "Nice hands", tags: ["safeForWork", "romantic"] },
  { text: "Spending an exorbitant amount of money on cheese", tags: ["safeForWork"] },
  { text: "Selective hearing", tags: ["safeForWork"] },
  { text: "Being held", tags: ["safeForWork", "romantic"] },
  { text: "Moving to a new city", tags: ["safeForWork"] },
  { text: "Traits you inherited from your mom", tags: ["safeForWork"] },
  { text: "Big sneeze", tags: ["safeForWork"] },
  { text: "The sound of people chewing", tags: ["safeForWork"] },
  { text: "Someone saying \"regime\" when they mean \"regimen\"", tags: ["safeForWork"] },
  { text: "Realizing you've had food in your teeth and nobody told you", tags: ["safeForWork"] },
  { text: "Yahoo search engine", tags: ["safeForWork", "popCulture"] },
  { text: "Oblivion", tags: ["safeForWork", "abstract"] },
  { text: "Extreeeeemely sore calves after a hike", tags: ["safeForWork"] },
  { text: "Unsolicited advice", tags: ["safeForWork"] },
  { text: "Getting totally ghosted after five seemingly positive dates", tags: ["safeForWork", "romantic", "inappropriate"] },
  { text: "Running late", tags: ["safeForWork"] },
  { text: "Someone insists you never mentioned something you've told them multiple times", tags: ["safeForWork"] },
  { text: "Getting genuinely lost in the woods (scary)", tags: ["safeForWork"] },
  { text: "Serendipity", tags: ["safeForWork", "abstract"] },
  { text: "Acute heartbreak", tags: ["safeForWork", "romantic", "inappropriate"] },
  { text: "Unloading the dishwasher", tags: ["safeForWork"] },
  { text: "Staying up too late", tags: ["safeForWork"] },
  { text: "Having your hair washed by someone else", tags: ["safeForWork", "romantic"] },
  { text: "Accidentally using your ex's name", tags: ["safeForWork", "romantic", "inappropriate"] },
  { text: "Being mean and then regretting it", tags: ["safeForWork"] },
  { text: "Being center of attention", tags: ["safeForWork"] },
  { text: "Winking at strangers", tags: ["safeForWork", "romantic", "inappropriate"] },
  { text: "A hole in your sock", tags: ["safeForWork"] },
  { text: "Forgetting someone's name", tags: ["safeForWork"] },
  { text: "First world problems", tags: ["safeForWork", "popCulture"] },
  { text: "Choosing a seat on a crowded bus", tags: ["safeForWork"] },
  { text: "First week of a new job", tags: ["safeForWork"] },
  { text: "Your clothes all smell like the dinner you cooked", tags: ["safeForWork"] },
  { text: "A very good dream", tags: ["safeForWork", "abstract"] },
  { text: "Feeling self-conscious", tags: ["safeForWork"] },
  { text: "Multiple major life changes all at once", tags: ["safeForWork"] },
  { text: "The smell of wet dog", tags: ["safeForWork"] },
  { text: "Taking a personality test", tags: ["safeForWork"] },
  { text: "Playing it by ear", tags: ["safeForWork"] },
  { text: "Bad first kiss with your crush", tags: ["safeForWork", "romantic"] },
  { text: "Cold ocean air", tags: ["safeForWork"] },
  { text: "Dreamin' and schemin'", tags: ["safeForWork", "abstract"] },
  { text: "Karmic revenge", tags: ["safeForWork", "abstract"] },
  { text: "Getting a compliment about something you were feeling self-conscious about", tags: ["safeForWork", "romantic"] },
  { text: "An awkward first date", tags: ["safeForWork", "romantic"] },
  { text: "Getting away with it", tags: ["safeForWork"] },
  { text: "Doubling down", tags: ["safeForWork"] },
  { text: "Killing people you hate with kindness", tags: ["safeForWork"] },
  { text: "Overeating by 20% because it was so delicious", tags: ["safeForWork"] },
  { text: "Strange visions", tags: ["safeForWork", "abstract"] },
  { text: "When people use \"then\" when they really mean \"than\"", tags: ["safeForWork"] },
  { text: "Death by 1,000 cuts", tags: ["safeForWork", "abstract"] },
  { text: "Forgiving someone", tags: ["safeForWork", "abstract"] },
  { text: "Burning bridges", tags: ["safeForWork", "abstract"] },
  { text: "Russian roulette but with fish tacos, 1 out of 6 is bad", tags: ["safeForWork", "nonsense", "popCulture"] },
  { text: "3-hour YouTube wormhole", tags: ["safeForWork", "popCulture"] },
  { text: "Getting yourself a neck tattoo", tags: ["safeForWork"] },
  { text: "Good dog lick on the face", tags: ["safeForWork"] },
  { text: "Crying", tags: ["safeForWork"] },
  { text: "Learning the hard way", tags: ["safeForWork", "abstract"] },
  { text: "Realizing you're in love with a platonic friend", tags: ["safeForWork", "romantic"] },
  { text: "Realizing you're being a hypocrite", tags: ["safeForWork"] },
  { text: "Getting three hours of sleep", tags: ["safeForWork"] },
  { text: "When the good guys win", tags: ["safeForWork", "popCulture"] },
  { text: "Yelling", tags: ["safeForWork"] },
  { text: "Forgetting your phone at home", tags: ["safeForWork"] },
  { text: "Your comfiest pants", tags: ["safeForWork"] },
  { text: "Being aware you are in a dream while you are dreaming", tags: ["safeForWork", "abstract"] },
  { text: "Fear of death", tags: ["safeForWork", "abstract"] },
  { text: "Retail therapy", tags: ["safeForWork", "popCulture"] },
  { text: "\"...\" popping up in iMessage", tags: ["safeForWork", "popCulture"] },
  { text: "Going to therapy", tags: ["safeForWork"] },
  { text: "Emergency Red Bull", tags: ["safeForWork"] },
  { text: "Change", tags: ["safeForWork", "abstract"] },
  { text: "Double stuffed Oreos", tags: ["safeForWork"] },
  { text: "Ability to forget", tags: ["safeForWork", "abstract"] },
  { text: "Going to a new hair stylist", tags: ["safeForWork"] },
  { text: "No toilet paper but you need to poop", tags: ["safeForWork"] },
  { text: "Unexpected guests", tags: ["safeForWork"] },
  { text: "Basking in glory", tags: ["safeForWork", "abstract"] },
  { text: "Petty theft for thrills", tags: ["safeForWork", "inappropriate"] },
  { text: "Brain fog", tags: ["safeForWork"] },
  { text: "Sinking to their level", tags: ["safeForWork"] },
  { text: "Stepping on a crunchy leaf", tags: ["safeForWork"] },
  { text: "Selling stuff on Facebook Marketplace", tags: ["safeForWork", "popCulture"] },
  { text: "Second chances", tags: ["safeForWork", "abstract"] },
  { text: "Wheelin' and dealin'", tags: ["safeForWork"] },
  { text: "Having to speak like Elmo 24-7 for the rest of your life", tags: ["safeForWork", "nonsense", "popCulture"] },
  { text: "Losing trust", tags: ["safeForWork", "abstract"] },
  { text: "Tasting power", tags: ["safeForWork", "abstract"] },
  { text: "Blooming late", tags: ["safeForWork", "abstract"] },
  { text: "Getting upgraded to first class unexpectedly due to airline seating error", tags: ["safeForWork"] },
  { text: "Raw-dogging it on the airplane", tags: ["safeForWork", "popCulture", "inappropriate"] },
  { text: "Shakin' it", tags: ["safeForWork"] },
  { text: "Lying to protect someone", tags: ["safeForWork"] },
  { text: "Jolting awake feeling as if you were falling while falling asleep", tags: ["safeForWork"] },
  { text: "Forgetting to take the trash out on garbage day", tags: ["safeForWork"] },
  { text: "Any mix-up of \"their\", \"there\", or \"they're\"", tags: ["safeForWork"] },
  { text: "Cheeto fingers", tags: ["safeForWork"] },
  { text: "Waking up from a weird nap", tags: ["safeForWork"] },
  { text: "Feeling disappointed", tags: ["safeForWork", "abstract"] },
  { text: "Awkward silences", tags: ["safeForWork"] },
  { text: "Biting and snuffling", tags: ["safeForWork", "romantic", "inappropriate"] },
  { text: "Waking up at 6 a.m. naturally", tags: ["safeForWork"] },
  { text: "Being brutally honest", tags: ["safeForWork"] },
  { text: "The meat sweats", tags: ["safeForWork"] },
  { text: "Going with the flow", tags: ["safeForWork", "abstract"] },
  { text: "Giving a shit", tags: ["safeForWork"] },
  { text: "A perfect cappuccino", tags: ["safeForWork"] },
  { text: "Mismatched socks", tags: ["safeForWork", "kidFriendly"] },
  { text: "Triple penetration", tags: ["inappropriate"] },
  { text: "Being able to see the future on demand", tags: ["safeForWork", "abstract", "kidFriendly"] },
  { text: "Collaboration", tags: ["safeForWork", "abstract"] },
  { text: "Venom nail polish", tags: ["safeForWork", "kidFriendly"] },
  { text: "Eavesdropping and hearing some juicy tea", tags: ["safeForWork", "popCulture"] },
  { text: "The land of milf and honey", tags: ["inappropriate"] },
  { text: "Pizza shops that put crayons out on the tables", tags: ["safeForWork", "kidFriendly"] },
  { text: "Writing thank you notes", tags: ["safeForWork", "kidFriendly"] },
  { text: "Being neutrally buoyant", tags: ["safeForWork"] },
  { text: "Riding a horse", tags: ["safeForWork", "kidFriendly"] },
  { text: "Giving a dog a bath", tags: ["safeForWork", "kidFriendly"] },
  { text: "Meeting the family", tags: ["safeForWork", "romantic"] },
  { text: "Being made a villain or a scapegoat", tags: ["safeForWork"] },
  { text: "Feeling indifferent", tags: ["safeForWork"] },
  { text: "Luscious locks", tags: ["safeForWork", "romantic"] },
  { text: "A stone in your shoe", tags: ["safeForWork", "kidFriendly"] },
  { text: "The first bad sunburn of the summer", tags: ["safeForWork", "kidFriendly"] },
  { text: "Shower sex", tags: ["inappropriate"] },
  { text: "Quarter life crisis", tags: ["safeForWork"] },
  { text: "Stepping in poo", tags: ["safeForWork", "kidFriendly"] },
  { text: "Feeling regret", tags: ["safeForWork"] },
  { text: "Crying in the shower", tags: ["safeForWork"] },
  { text: "Obvious hickey", tags: ["inappropriate", "romantic"] },
  { text: "Hospitals", tags: ["safeForWork"] },
  { text: "When the juice is flowin", tags: ["inappropriate"] },
  { text: "Eye crusties", tags: ["safeForWork", "kidFriendly"] },
  { text: "Sitting next to a \"talker\" at the bar", tags: ["safeForWork"] },
  { text: "Living forever", tags: ["safeForWork", "abstract"] },
  { text: "Pollen", tags: ["safeForWork", "kidFriendly"] },
  { text: "Sweating", tags: ["safeForWork"] },
  { text: "Being 24", tags: ["safeForWork"] },
  { text: "Earning a gold star", tags: ["safeForWork", "kidFriendly"] },
  { text: "When you get too high at a wedding", tags: ["inappropriate"] },
  { text: "Cheating on your diet with something delicious", tags: ["safeForWork"] },
  { text: "Biking 100 miles all downhill, slight decline", tags: ["safeForWork"] },
  { text: "Performing a song in front of a large audience", tags: ["safeForWork", "kidFriendly"] },
  { text: "The first bite of the treat you bought for yourself", tags: ["safeForWork", "kidFriendly"] },
  { text: "Taking a risk and actually being successful", tags: ["safeForWork", "abstract"] },
  { text: "Being stuck at home", tags: ["safeForWork", "kidFriendly"] },
  { text: "When your favorite song plays on the radio", tags: ["safeForWork", "popCulture"] },
  { text: "A light touch that makes your arm hairs stand up", tags: ["safeForWork", "romantic"] },
  { text: "Chirpin' and burpin'", tags: ["safeForWork", "kidFriendly", "nonsense"] },
  { text: "Job performance review coming up", tags: ["safeForWork"] },
  { text: "Standing up to your childhood bully", tags: ["safeForWork", "kidFriendly"] },
  { text: "Hairball", tags: ["safeForWork", "kidFriendly"] },
  { text: "Making sweet, sweet love", tags: ["inappropriate", "romantic"] },
  { text: "Netflix n' krill", tags: ["safeForWork", "popCulture", "nonsense"] },
  { text: "Accidentally killing your favorite houseplant", tags: ["safeForWork"] },
  { text: "Ear kisses / someone putting your earlobe in their mouth", tags: ["romantic", "inappropriate"] },
  { text: "Cuck whale", tags: ["inappropriate"] },
  { text: "Making lists", tags: ["safeForWork"] },
  { text: "Losing at board games", tags: ["safeForWork"] },
  { text: "A surprise party in your honor", tags: ["safeForWork"] },
  { text: "Crossing the last item off your to-do list", tags: ["safeForWork"] },
  { text: "Raising the bar", tags: ["safeForWork", "abstract"] },
  { text: "Peanut butter, pickles, mayo sandwich", tags: ["safeForWork"] },
  { text: "A gritty smoothie", tags: ["safeForWork"] },
  { text: "Tube tops", tags: ["safeForWork"] },
  { text: "Shower head", tags: ["romantic", "inappropriate"] },
  { text: "Social security benefits", tags: ["safeForWork"] },
  { text: "Opening a present that you really don't like in front of the giver", tags: ["safeForWork"] },
  { text: "Taking a bath", tags: ["safeForWork"] },
  { text: "Crazy chemistry", tags: ["romantic"] },
  { text: "Friday deploys", tags: ["safeForWork", "baseAccount"] },
  { text: "Facial hair", tags: ["safeForWork"] },
  { text: "Western medicine", tags: ["safeForWork"] },
  { text: "Being a diva", tags: ["safeForWork"] },
  { text: "Being part of the first space colony", tags: ["safeForWork", "abstract"] },
  { text: "Sobbing", tags: ["safeForWork"] },
  { text: "Listening to wellness podcasts", tags: ["safeForWork", "popCulture"] },
  { text: "Temps above 90 degrees", tags: ["safeForWork"] },
  { text: "Your dog gains the ability to speak, but their voice is extremely annoying", tags: ["safeForWork", "nonsense"] },
  { text: "Waking up and you're still high", tags: ["inappropriate"] },
  { text: "Riding on the roof of a car", tags: ["safeForWork"] },
  { text: "Lukewarm coffee", tags: ["safeForWork"] },
  { text: "Being normal", tags: ["safeForWork", "abstract"] },
  { text: "Getting a mani-pedi", tags: ["safeForWork"] },
  { text: "Digging your hands in dirt", tags: ["safeForWork"] },
  { text: "Speeding", tags: ["safeForWork"] },
  { text: "Guilty dog faces", tags: ["safeForWork", "kidFriendly"] },
  { text: "Forgetting how to do your job", tags: ["safeForWork"] },
  { text: "Nudes of your besties", tags: ["inappropriate"] },
  { text: "A big group campsite", tags: ["safeForWork"] },
  { text: "A review of a favorite book/movie that you totally disagree with", tags: ["safeForWork", "popCulture"] },
  { text: "Finding money in your pocket after doing laundry", tags: ["safeForWork"] },
  { text: "Being mistaken for Gen Z", tags: ["safeForWork", "popCulture"] },
  { text: "A hat when the sun is in your eyes", tags: ["safeForWork"] },
  { text: "Finding a bargain", tags: ["safeForWork"] },
  { text: "Feeling seen", tags: ["safeForWork", "abstract"] },
  { text: "A blister", tags: ["safeForWork"] },
  { text: "Four missed calls from loved ones when you look at your phone", tags: ["safeForWork"] },
  { text: "Talking with strangers at a party", tags: ["safeForWork"] },
  { text: "Strap-ons", tags: ["inappropriate"] },
  { text: "A surprise day off of work", tags: ["safeForWork"] },
  { text: "A grand spagurtti squanch", tags: ["safeForWork", "nonsense"] },
  { text: "Accidentally biting your tongue while eating food", tags: ["safeForWork"] },
  { text: "Commercial integrity", tags: ["safeForWork", "abstract"] },
  { text: "Slime", tags: ["safeForWork", "kidFriendly"] },
  { text: "A six-hour flight with constant turbulence", tags: ["safeForWork"] },
  { text: "Overripe bananas", tags: ["safeForWork"] },
  { text: "A chewing gum", tags: ["safeForWork"] },
  { text: "Decorating for the holidays", tags: ["safeForWork", "kidFriendly"] },
  { text: "Extra mayo", tags: ["safeForWork"] },
  { text: "Giant zit", tags: ["safeForWork"] },
  { text: "Inheritance of millions", tags: ["safeForWork"] },
  { text: "A party that goes too late", tags: ["safeForWork"] },
  { text: "Warming your hands on someone's belly", tags: ["safeForWork", "romantic"] },
  { text: "Getting a new bike", tags: ["safeForWork", "kidFriendly"] },
  { text: "Great first kiss with your crush", tags: ["safeForWork", "romantic"] },
  { text: "Finding your leftovers have already been eaten", tags: ["safeForWork"] },
  { text: "Getting the last two ice cubes for your bevy", tags: ["safeForWork"] },
  { text: "An overconfident friend", tags: ["safeForWork"] },
  { text: "Telling a white lie", tags: ["safeForWork"] },
  { text: "Spying on people", tags: ["safeForWork"] },
  { text: "Dog barking all night", tags: ["safeForWork"] },
  { text: "Euphemisms", tags: ["safeForWork"] },
  { text: "Holding a hedgehog", tags: ["safeForWork", "kidFriendly"] },
  { text: "Having to watch Sesame Street while babysitting", tags: ["safeForWork", "kidFriendly", "popCulture"] },
  { text: "Farting in front of your crush", tags: ["safeForWork", "romantic"] },
  { text: "Playing hooky", tags: ["safeForWork"] },
  { text: "Purple people eater", tags: ["safeForWork", "popCulture", "nonsense"] },
  { text: "Leftovers fitting perfectly into the first Tupperware you choose", tags: ["safeForWork"] },
]

// Helper function: Get prompts that match ANY of the selected tags (union/OR logic)
export function getPromptsByTags(selectedTags: PromptCategoryKey[]): string[] {
  if (selectedTags.length === 0) return []
  return PROMPTS
    .filter(prompt => prompt.tags.some(tag => selectedTags.includes(tag)))
    .map(prompt => prompt.text)
}

// Define category keys first to avoid circular reference
export type PromptCategoryKey = 'safeForWork' | 'romantic' | 'kidFriendly' | 'baseAccount' | 'nonsense' | 'abstract' | 'popCulture' | 'inappropriate'

// Category metadata (for UI display)
export const PROMPT_CATEGORIES: Record<PromptCategoryKey, CategoryMetadata> = {
  safeForWork: {
    name: "Safe for Work"
  },
  romantic: {
    name: "Romantic"
  },
  kidFriendly: {
    name: "Kid-Friendly"
  },
  baseAccount: {
    name: "Base Account"
  },
  nonsense: {
    name: "Nonsense"
  },
  abstract: {
    name: "Abstract"
  },
  popCulture: {
    name: "Pop Culture"
  },
  inappropriate: {
    name: "Inappropriate"
  }
} as const

// Helper to get prompt count for a category (for UI display)
export function getPromptCountForCategory(categoryKey: PromptCategoryKey): number {
  return PROMPTS.filter(prompt => prompt.tags.includes(categoryKey)).length
}

export const DEFAULT_IDEAS = getPromptsByTags(['kidFriendly'])

export type GamePhase = 'lobby' | 'ranking' | 'waiting' | 'reveal' | 'scores' | 'finished'