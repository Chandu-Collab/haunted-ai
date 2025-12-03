export type StoryGenre = 'horror' | 'mystery' | 'romance' | 'adventure' | 'psychological' | 'gothic' | 'supernatural' | 'thriller';
export type StoryMood = 'suspenseful' | 'mysterious' | 'frightening' | 'melancholic' | 'hopeful' | 'romantic' | 'dark' | 'whimsical' | 'intense' | 'peaceful';
export type ConsequenceMood = 'brave' | 'curious' | 'cautious' | 'fearful' | 'compassionate' | 'aggressive' | 'playful';
export type StoryLength = 'short' | 'medium' | 'long';

export interface StoryMetadata {
  id: string;
  title: string;
  description: string;
  genre: StoryGenre;
  primaryMood: StoryMood;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedLength: 'short' | 'medium' | 'long';
  themes: string[];
}

export interface StorySegment {
  id: string;
  text: string;
  choices: StoryChoice[];
  mood: StoryMood;
  atmosphere: string;
  genre?: StoryGenre;
  emotionalIntensity: 'low' | 'medium' | 'high';
}

export interface StoryChoice {
  id: string;
  text: string;
  nextSegmentId: string;
  consequenceMood: ConsequenceMood;
  moodShift?: StoryMood;
}

export interface ActiveStory {
  storyId: string;
  currentSegmentId: string;
  userChoices: string[];
  personalizedElements: string[];
  sessionId: string;
  startedAt: Date;
  selectedGenre: StoryGenre;
  selectedMood: StoryMood;
  storyLength?: StoryLength;
  currentPart?: number;
  totalParts?: number;
  isMultiPart?: boolean;
  dynamicElements: {
    userPreferences: string[];
    moodProgression: StoryMood[];
    interactionHistory: string[];
  };
}

export class StorytellingSystem {
  private activeStories: Map<string, ActiveStory> = new Map();
  private usedStoryElements: Map<string, Set<string>> = new Map(); // Track used story elements per session
  private storyTemplates: Map<StoryGenre, string[]> = new Map();
  
  constructor() {
    this.initializeStoryTemplates();
  }
  
  private initializeStoryTemplates() {
    // Initialize story template pools for each genre
    this.storyTemplates.set('horror', [
      'abandoned_asylum', 'cursed_doll', 'forest_cabin', 'underground_catacombs', 
      'haunted_lighthouse', 'old_cemetery', 'possessed_mirror', 'witch_cottage',
      'ghost_ship', 'demonic_church', 'nightmare_hotel', 'blood_mansion'
    ]);
    
    this.storyTemplates.set('mystery', [
      'missing_person', 'stolen_artifact', 'secret_society', 'hidden_treasure',
      'mysterious_letter', 'locked_room', 'vanished_village', 'coded_diary',
      'phantom_thief', 'ancient_riddle', 'disappeared_train', 'false_identity'
    ]);
    
    this.storyTemplates.set('romance', [
      'lost_love_letters', 'wedding_veil_ghost', 'star_crossed_spirits', 'eternal_dance',
      'love_across_time', 'guardian_angel', 'reincarnated_lovers', 'spirit_bride',
      'ghost_musician', 'tragic_artist', 'lighthouse_keeper', 'garden_spirit'
    ]);
    
    this.storyTemplates.set('adventure', [
      'treasure_hunt', 'spirit_realm', 'magical_quest', 'time_portal',
      'mystical_journey', 'ancient_temple', 'elemental_trials', 'cosmic_voyage',
      'otherworld_expedition', 'enchanted_forest', 'sky_castle', 'underwater_kingdom'
    ]);
    
    this.storyTemplates.set('psychological', [
      'memory_fragments', 'dual_personality', 'reality_distortion', 'consciousness_split',
      'dream_layers', 'mind_maze', 'identity_crisis', 'perception_shift',
      'psychological_mirror', 'mental_labyrinth', 'thought_echo', 'shadow_self'
    ]);
    
    this.storyTemplates.set('gothic', [
      'cathedral_shadows', 'noble_curse', 'family_portrait', 'ancient_bloodline',
      'gothic_romance', 'monastery_secrets', 'aristocrat_ghost', 'medieval_castle',
      'dark_cathedral', 'vampire_lineage', 'stone_gargoyle', 'forbidden_library'
    ]);
    
    this.storyTemplates.set('supernatural', [
      'spirit_guardian', 'dimensional_rift', 'astral_projection', 'psychic_awakening',
      'elemental_spirits', 'cosmic_entities', 'soul_journey', 'ethereal_realm',
      'spirit_medium', 'otherworld_guide', 'mystical_energy', 'supernatural_powers'
    ]);
    
    this.storyTemplates.set('thriller', [
      'supernatural_chase', 'ghostly_stalker', 'phantom_pursuit', 'spirit_revenge',
      'haunted_escape', 'spectral_hunter', 'otherworld_trap', 'time_race',
      'soul_thief', 'entity_hunt', 'paranormal_conspiracy', 'spirit_war'
    ]);
  }
  
  private storyMetadata: Record<string, StoryMetadata> = {
    'mansion_mystery': {
      id: 'mansion_mystery',
      title: 'The Mansion\'s Secret',
      description: 'Explore a haunted mansion and uncover its dark mysteries',
      genre: 'horror',
      primaryMood: 'suspenseful',
      difficulty: 'medium',
      estimatedLength: 'medium',
      themes: ['haunted house', 'family secrets', 'supernatural']
    },
    'lonely_spirit': {
      id: 'lonely_spirit',
      title: 'The Lonely Reader',
      description: 'Meet a melancholic spirit in an ancient library',
      genre: 'gothic',
      primaryMood: 'melancholic',
      difficulty: 'easy',
      estimatedLength: 'short',
      themes: ['loneliness', 'books', 'gentle ghost']
    },
    'romantic_specter': {
      id: 'romantic_specter',
      title: 'Love Beyond Death',
      description: 'A ghost yearns for a love that transcends the mortal realm',
      genre: 'romance',
      primaryMood: 'romantic',
      difficulty: 'medium',
      estimatedLength: 'long',
      themes: ['eternal love', 'tragedy', 'redemption']
    },
    'mystery_manor': {
      id: 'mystery_manor',
      title: 'The Vanishing Guests',
      description: 'Investigate the mysterious disappearances at a grand estate',
      genre: 'mystery',
      primaryMood: 'mysterious',
      difficulty: 'hard',
      estimatedLength: 'long',
      themes: ['detective work', 'clues', 'hidden passages']
    },
    'whimsical_spirit': {
      id: 'whimsical_spirit',
      title: 'The Playful Phantom',
      description: 'Meet a mischievous but kind-hearted ghost who loves games',
      genre: 'supernatural',
      primaryMood: 'whimsical',
      difficulty: 'easy',
      estimatedLength: 'short',
      themes: ['friendship', 'play', 'lighthearted']
    },
    'psychological_horror': {
      id: 'psychological_horror',
      title: 'Echoes of the Mind',
      description: 'Question reality as you navigate a ghost\'s fractured psyche',
      genre: 'psychological',
      primaryMood: 'intense',
      difficulty: 'hard',
      estimatedLength: 'medium',
      themes: ['sanity', 'perception', 'psychological thriller']
    }
  };
  
  private ghostStories: Record<string, StorySegment[]> = {
    'mansion_mystery': [
      {
        id: 'start',
        text: 'You find yourself standing before an ancient oak door, its brass handle cold to the touch. Shadows dance across the walls as lightning illuminates the hallway. You hear a faint whisper calling your name from somewhere deep within the mansion...',
        choices: [
          {
            id: 'enter_cautiously',
            text: 'Push the door open slowly and carefully',
            nextSegmentId: 'careful_entry',
            consequenceMood: 'cautious'
          },
          {
            id: 'enter_boldly',
            text: 'Throw the door open and stride confidently inside',
            nextSegmentId: 'bold_entry',
            consequenceMood: 'brave'
          },
          {
            id: 'listen_first',
            text: 'Press your ear to the door and listen',
            nextSegmentId: 'listening',
            consequenceMood: 'curious'
          }
        ],
        mood: 'suspenseful',
        atmosphere: 'A storm rages outside, casting eerie shadows through the windows',
        emotionalIntensity: 'medium'
      },
      {
        id: 'careful_entry',
        text: 'The door creaks open to reveal a grand foyer draped in dust and memories. A crystal chandelier hangs precariously above, its crystals tinkling with each gust of wind. You notice fresh footprints in the dust leading toward a spiral staircase...',
        choices: [
          {
            id: 'follow_footprints',
            text: 'Follow the mysterious footprints',
            nextSegmentId: 'staircase_encounter',
            consequenceMood: 'curious'
          },
          {
            id: 'examine_chandelier',
            text: 'Look up at the chandelier more closely',
            nextSegmentId: 'chandelier_discovery',
            consequenceMood: 'cautious'
          },
          {
            id: 'call_out',
            text: 'Call out "Hello? Is anyone there?"',
            nextSegmentId: 'voice_response',
            consequenceMood: 'brave'
          }
        ],
        mood: 'mysterious',
        atmosphere: 'Dust motes dance in the pale moonlight streaming through tall windows'
      },
      {
        id: 'bold_entry',
        text: 'Your confident stride echoes through the mansion as you enter. Suddenly, the door slams shut behind you with a resounding crash! The sound reverberates through the halls, and you hear what sounds like distant laughter... or is it sobbing?',
        choices: [
          {
            id: 'try_door',
            text: 'Try to open the door you just came through',
            nextSegmentId: 'trapped',
            consequenceMood: 'fearful'
          },
          {
            id: 'shout_challenge',
            text: 'Shout "Show yourself!" into the darkness',
            nextSegmentId: 'ghost_appears',
            consequenceMood: 'brave'
          },
          {
            id: 'explore_forward',
            text: 'Continue forward, ignoring the closed door',
            nextSegmentId: 'deeper_mansion',
            consequenceMood: 'curious'
          }
        ],
        mood: 'frightening',
        atmosphere: 'The air grows cold, and shadows seem to move independently of their sources'
      },
      {
        id: 'listening',
        text: 'Pressing your ear to the door, you hear the faint sound of a music box playing a melancholic melody. The tune is hauntingly beautiful, yet fills you with an inexplicable sadness. As you listen, you swear you hear a voice humming along...',
        choices: [
          {
            id: 'hum_along',
            text: 'Start humming along with the melody',
            nextSegmentId: 'musical_connection',
            consequenceMood: 'curious'
          },
          {
            id: 'knock_gently',
            text: 'Knock gently on the door',
            nextSegmentId: 'gentle_response',
            consequenceMood: 'cautious'
          },
          {
            id: 'back_away',
            text: 'Step back from the door, unsettled',
            nextSegmentId: 'retreat_attempt',
            consequenceMood: 'fearful'
          }
        ],
        mood: 'melancholic',
        atmosphere: 'The melody seems to come from everywhere and nowhere at once'
      }
    ],
    
    'lonely_spirit': [
      {
        id: 'start',
        text: 'In the corner of the library, you notice a figure sitting alone, translucent and shimmering. She appears to be reading a book, but her eyes seem to look right through the pages. When she notices you, a sad smile crosses her ethereal features...',
        choices: [
          {
            id: 'approach_kindly',
            text: 'Walk over and ask if she\'s alright',
            nextSegmentId: 'kind_approach',
            consequenceMood: 'brave'
          },
          {
            id: 'observe_quietly',
            text: 'Watch her quietly from a distance',
            nextSegmentId: 'quiet_observation',
            consequenceMood: 'cautious'
          },
          {
            id: 'ask_about_book',
            text: 'Ask what book she\'s reading',
            nextSegmentId: 'book_discussion',
            consequenceMood: 'curious'
          }
        ],
        mood: 'melancholic',
        atmosphere: 'Soft lamplight creates a warm but lonely ambiance among the dusty books'
      }
    ]
  };

  startStory(sessionId: string, storyId: string, userName?: string): StorySegment | null {
    if (!this.ghostStories[storyId]) {
      return null;
    }

    const story = this.ghostStories[storyId];
    const firstSegment = story[0];
    
    const activeStory: ActiveStory = {
      storyId,
      currentSegmentId: firstSegment.id,
      userChoices: [],
      personalizedElements: userName ? [userName] : [],
      sessionId,
      startedAt: new Date()
    };

    this.activeStories.set(sessionId, activeStory);
    
    // Personalize the story if we have user info
    let personalizedText = firstSegment.text;
    if (userName) {
      personalizedText = personalizedText.replace(/you hear a faint whisper/g, 
        `you hear a whisper calling "${userName}"`);
    }

    return {
      ...firstSegment,
      text: personalizedText
    };
  }

  makeChoice(sessionId: string, choiceId: string): StorySegment | null {
    const activeStory = this.activeStories.get(sessionId);
    if (!activeStory) {
      return null;
    }

    const story = this.ghostStories[activeStory.storyId];
    const currentSegment = story.find(s => s.id === activeStory.currentSegmentId);
    
    if (!currentSegment) {
      return null;
    }

    const choice = currentSegment.choices.find(c => c.id === choiceId);
    if (!choice) {
      return null;
    }

    // Update the active story
    activeStory.userChoices.push(choiceId);
    activeStory.currentSegmentId = choice.nextSegmentId;

    // Find the next segment
    const nextSegment = story.find(s => s.id === choice.nextSegmentId);
    
    if (!nextSegment) {
      // Story has ended
      this.activeStories.delete(sessionId);
      return null;
    }

    this.activeStories.set(sessionId, activeStory);
    return nextSegment;
  }

  getCurrentStory(sessionId: string): ActiveStory | null {
    return this.activeStories.get(sessionId) || null;
  }

  endStory(sessionId: string): boolean {
    return this.activeStories.delete(sessionId);
  }

  getAvailableStories(): Array<{id: string, title: string, description: string}> {
    return [
      {
        id: 'mansion_mystery',
        title: 'The Mansion\'s Secret',
        description: 'Explore a haunted mansion and uncover its dark mysteries'
      },
      {
        id: 'lonely_spirit',
        title: 'The Lonely Reader',
        description: 'Meet a melancholic spirit in an ancient library'
      }
    ];
  }

  generateContinuationPrompt(sessionId: string, userInput: string): string {
    const activeStory = this.activeStories.get(sessionId);
    if (!activeStory) {
      return '';
    }

    let prompt = '\n\n--- STORY CONTEXT ---\n';
    prompt += `Currently telling: ${activeStory.storyId}\n`;
    prompt += `User choices so far: ${activeStory.userChoices.join(', ')}\n`;
    prompt += `Story started: ${activeStory.startedAt.toLocaleTimeString()}\n`;
    
    if (activeStory.personalizedElements.length > 0) {
      prompt += `Personal elements: ${activeStory.personalizedElements.join(', ')}\n`;
    }
    
    prompt += 'Continue the story based on the user\'s response, maintaining the atmospheric tone.\n';
    prompt += '--- END STORY CONTEXT ---\n\n';
    
    return prompt;
  }

  personalizeStoryForUser(storyText: string, userName?: string, interests?: string[]): string {
    let personalized = storyText;
    
    if (userName) {
      personalized = personalized.replace(/\byou\b/g, userName);
    }
    
    if (interests && interests.length > 0) {
      // Add elements related to user's interests
      if (interests.includes('music')) {
        personalized += ' You notice an old piano in the corner, its keys yellowed with age.';
      }
      if (interests.includes('books')) {
        personalized += ' Ancient leather-bound books line the shelves, their spines worn with time.';
      }
      if (interests.includes('art')) {
        personalized += ' Mysterious paintings hang on the walls, their subjects seeming to watch you.';
      }
    }
    
    return personalized;
  }

  // Generate a custom story based on user preferences
  async generateCustomStory(preferences: {
    genre: StoryGenre;
    mood: StoryMood;
    length: StoryLength;
    playerName: string;
    sessionId: string;
  }): Promise<ActiveStory | null> {
    try {
      const { genre, mood, length, playerName, sessionId } = preferences;
      
      // Create custom story metadata
      const customStoryId = `custom-${genre}-${mood}-${length}-${Date.now()}`;
      const storyTitle = this.generateStoryTitle(genre, mood);
      
      // Calculate parts based on length
      const { totalParts, isMultiPart } = this.getStoryStructure(length);
      
      // Generate initial story content based on preferences
      const initialContent = this.generateInitialStoryContent(genre, mood, length, playerName, 1, totalParts);
      
      // Create story segment with appropriate choices for length
      const initialSegment: StorySegment = {
        id: 'custom-start-1',
        text: initialContent,
        choices: this.generateChoicesForStoryLength(genre, mood, length, 1, totalParts),
        mood: mood,
        atmosphere: this.getAtmosphereForMood(mood),
        genre: genre,
        emotionalIntensity: 'medium'
      };
      
      // Create active story
      const activeStory: ActiveStory = {
        storyId: customStoryId,
        currentSegmentId: initialSegment.id,
        userChoices: [],
        personalizedElements: [playerName],
        sessionId: sessionId,
        startedAt: new Date(),
        selectedGenre: genre,
        selectedMood: mood,
        storyLength: length,
        currentPart: 1,
        totalParts: totalParts,
        isMultiPart: isMultiPart,
        dynamicElements: {
          userPreferences: [genre, mood, length],
          moodProgression: [mood],
          interactionHistory: []
        }
      };
      
      // Store the story and segment
      this.activeStories.set(sessionId, activeStory);
      
      return {
        ...activeStory,
        currentSegment: initialSegment,
        title: storyTitle,
        content: initialContent
      } as any;
      
    } catch (error) {
      console.error('Error generating custom story:', error);
      return null;
    }
  }

  private generateStoryTitle(genre: StoryGenre, mood: StoryMood): string {
    const titleTemplates: Record<StoryGenre, string[]> = {
      horror: ['The Haunted', 'Nightmare of', 'Terror in', 'The Cursed'],
      mystery: ['The Secret of', 'Mystery at', 'The Enigma of', 'Shadows of'],
      romance: ['Love in', 'The Heart of', 'Passion at', 'Romance in'],
      adventure: ['Journey to', 'Quest for', 'Adventure in', 'The Expedition to'],
      psychological: ['Minds of', 'The Psyche of', 'Thoughts in', 'Consciousness of'],
      gothic: ['The Gothic', 'Dark Tales of', 'The Cathedral of', 'Shadows in'],
      supernatural: ['Spirits of', 'The Otherworld of', 'Phantoms in', 'The Ethereal'],
      thriller: ['The Chase in', 'Danger at', 'The Hunt for', 'Pursuit in']
    };
    
    const moodAdjectives: Record<StoryMood, string[]> = {
      mysterious: ['Veiled', 'Hidden', 'Shrouded', 'Enigmatic'],
      frightening: ['Terrifying', 'Nightmarish', 'Dreadful', 'Horrifying'],
      romantic: ['Enchanted', 'Dreamy', 'Passionate', 'Tender'],
      dark: ['Shadow', 'Obsidian', 'Midnight', 'Noir'],
      hopeful: ['Dawn', 'Radiant', 'Blessed', 'Luminous'],
      melancholic: ['Sorrowful', 'Wistful', 'Melancholy', 'Bittersweet'],
      suspenseful: ['Tense', 'Edge', 'Precipice', 'Threshold'],
      whimsical: ['Peculiar', 'Curious', 'Whimsical', 'Fantastical'],
      intense: ['Fierce', 'Burning', 'Tempest', 'Inferno'],
      peaceful: ['Serene', 'Tranquil', 'Gentle', 'Calm']
    };
    
    const template = titleTemplates[genre][Math.floor(Math.random() * titleTemplates[genre].length)];
    const adjective = moodAdjectives[mood][Math.floor(Math.random() * moodAdjectives[mood].length)];
    
    return `${template} ${adjective} Manor`;
  }

  private generateInitialStoryContent(genre: StoryGenre, mood: StoryMood, length: StoryLength, playerName: string, currentPart: number, totalParts: number): string {
    // Get a unique story template for this genre
    const sessionKey = `${genre}-${mood}-${Date.now()}`;
    const template = this.getUniqueStoryTemplate(genre, sessionKey);
    
    const storyContent = this.generateStoryContentFromTemplate(template, genre, mood, playerName);
    
    // Add part indicator for multi-part stories
    if (totalParts > 1) {
      const lengthDescriptors = {
        medium: 'This tale unfolds in parts, each revealing deeper mysteries...',
        long: 'This epic narrative spans multiple chapters, each more captivating than the last...'
      };
      return storyContent + `\n\n*${lengthDescriptors[length as 'medium' | 'long'] || 'Your story begins...'} Part ${currentPart} of ${totalParts}*`;
    }
    
    return storyContent;
  }

  private getUniqueStoryTemplate(genre: StoryGenre, sessionKey: string): string {
    const templates = this.storyTemplates.get(genre) || [];
    if (!this.usedStoryElements.has(sessionKey)) {
      this.usedStoryElements.set(sessionKey, new Set());
    }
    
    const usedElements = this.usedStoryElements.get(sessionKey)!;
    const availableTemplates = templates.filter(template => !usedElements.has(template));
    
    // If all templates have been used, reset the used elements for this session
    if (availableTemplates.length === 0) {
      usedElements.clear();
      availableTemplates.push(...templates);
    }
    
    const selectedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    usedElements.add(selectedTemplate);
    
    return selectedTemplate;
  }

  private generateStoryContentFromTemplate(template: string, genre: StoryGenre, mood: StoryMood, playerName: string): string {
    const storyElements = this.getStoryElements(template, genre);
    const moodModifier = this.getMoodModifier(mood);
    const setting = this.generateSetting(genre, template);
    const character = this.generateCharacter(genre, template);
    const conflict = this.generateConflict(genre, mood, template);
    
    return `${playerName} ${storyElements.opening} ${setting}. ${character} ${moodModifier} ${conflict}`;
  }

  private getStoryElements(template: string, genre: StoryGenre) {
    const elements: Record<string, any> = {
      // Horror templates
      abandoned_asylum: {
        opening: "approaches the crumbling gates of Ravenshollow Asylum, where screams once echoed through the night",
        setting: "broken windows stare like hollow eyes, and ivy crawls over walls stained with decades of despair"
      },
      cursed_doll: {
        opening: "discovers an antique porcelain doll in the dusty corner of an estate sale",
        setting: "its glassy eyes seem to follow every movement, and its smile holds secrets too dark to imagine"
      },
      forest_cabin: {
        opening: "stumbles upon a weathered cabin deep in the Whispering Woods",
        setting: "ancient trees lean inward like gnarled fingers, and shadows dance with malevolent intent"
      },
      
      // Mystery templates  
      missing_person: {
        opening: "receives a cryptic phone call about a person who vanished without a trace",
        setting: "the last known location holds clues that defy logical explanation"
      },
      stolen_artifact: {
        opening: "is hired to investigate the theft of a mysterious ancient relic",
        setting: "the museum's security footage shows impossible phenomena surrounding the artifact's disappearance"
      },
      secret_society: {
        opening: "uncovers evidence of a clandestine organization operating in the shadows",
        setting: "their symbols appear in the most unexpected places, hinting at a conspiracy beyond comprehension"
      },
      
      // Romance templates
      lost_love_letters: {
        opening: "finds a bundle of love letters tied with a faded ribbon in an old trunk",
        setting: "each letter speaks of a passion that transcends death itself"
      },
      wedding_veil_ghost: {
        opening: "encounters the spirit of a bride who never made it to her wedding day",
        setting: "her ethereal form appears in mirrors, searching for the love that was stolen from her"
      },
      star_crossed_spirits: {
        opening: "witnesses two ghostly figures meeting under the pale moonlight",
        setting: "their love story spans centuries, doomed to repeat until their souls find peace"
      },
      
      // Adventure templates
      treasure_hunt: {
        opening: "discovers a map leading to a treasure hidden in the spirit realm",
        setting: "each step forward takes them deeper into a world where the impossible becomes reality"
      },
      spirit_realm: {
        opening: "crosses the threshold into a dimension where spirits dwell freely",
        setting: "the landscape shifts like living dreams, and every path leads to new wonders and dangers"
      },
      magical_quest: {
        opening: "is chosen by an ancient spirit to undertake a mystical journey",
        setting: "the quest will test not just courage, but the very essence of their soul"
      },
      
      // Psychological templates
      memory_fragments: {
        opening: "begins experiencing memories that don't belong to them",
        setting: "reality blurs as past and present merge in their mind"
      },
      dual_personality: {
        opening: "realizes they're sharing their consciousness with another entity",
        setting: "the boundary between self and other dissolves in terrifying ways"
      },
      reality_distortion: {
        opening: "questions everything they thought they knew about reality",
        setting: "the world around them shifts like a nightmare that refuses to end"
      },
      
      // Gothic templates
      cathedral_shadows: {
        opening: "enters an ancient cathedral where shadows hold their own communion",
        setting: "stained glass windows cast eerie patterns that seem to move with divine malevolence"
      },
      noble_curse: {
        opening: "inherits an ancestral estate along with its terrible family curse",
        setting: "portraits of long-dead relatives seem to watch with knowing, sorrowful eyes"
      },
      family_portrait: {
        opening: "notices their face appearing in a centuries-old family painting",
        setting: "the portrait changes each time they look away, revealing dark family secrets"
      },
      
      // Supernatural templates
      spirit_guardian: {
        opening: "discovers they have a supernatural protector watching over them",
        setting: "signs of otherworldly intervention appear in the most mundane moments"
      },
      dimensional_rift: {
        opening: "accidentally opens a gateway between the world of the living and the dead",
        setting: "entities from beyond begin to seep through, changing everything they touch"
      },
      psychic_awakening: {
        opening: "suddenly develops the ability to see and communicate with spirits",
        setting: "the supernatural world that was always hidden now demands their attention"
      },
      
      // Thriller templates
      supernatural_chase: {
        opening: "finds themselves being pursued by an entity that exists beyond physical laws",
        setting: "no hiding place is safe when your pursuer can phase through walls and appear in dreams"
      },
      ghostly_stalker: {
        opening: "realizes they're being watched by a presence that grows stronger each day",
        setting: "signs of the entity's attention escalate from whispers to violent manifestations"
      },
      phantom_pursuit: {
        opening: "must outrun a vengeful spirit across multiple planes of existence",
        setting: "the chase spans both the physical world and the realm of nightmares"
      }
    };
    
    return elements[template] || {
      opening: "finds themselves in an extraordinary supernatural situation",
      setting: "where the ordinary rules of reality no longer apply"
    };
  }

  private getMoodModifier(mood: StoryMood): string {
    const modifiers: Record<StoryMood, string> = {
      mysterious: 'Ancient symbols glow faintly on nearby surfaces, their meaning lost to mortal understanding.',
      frightening: 'Terror grips the air itself as malevolent forces stir in the darkness.',
      romantic: 'The atmosphere shimmers with the bittersweet essence of eternal love.',
      dark: 'Oppressive shadows seem to have their own consciousness, watching and waiting.',
      hopeful: 'Despite the supernatural atmosphere, a gentle warmth suggests protection from benevolent forces.',
      melancholic: 'A profound sadness permeates everything, the weight of countless untold stories.',
      suspenseful: 'Every sound and movement builds tension as unseen eyes watch from the void.',
      whimsical: 'Playful spiritual energy dances through the air, bringing both wonder and uncertainty.',
      intense: 'The supernatural forces crackle with overwhelming power that demands immediate attention.',
      peaceful: 'Serene otherworldly energy flows around like a gentle embrace from beyond.'
    };
    
    return modifiers[mood];
  }

  private generateSetting(genre: StoryGenre, template: string): string {
    // Generate dynamic setting descriptions based on genre and template
    const timeOfDay = ['dawn', 'midday', 'dusk', 'midnight', 'the witching hour'][Math.floor(Math.random() * 5)];
    const weather = ['misty', 'stormy', 'eerily calm', 'windy', 'moonlit'][Math.floor(Math.random() * 5)];
    
    return `The ${weather} ${timeOfDay} creates an otherworldly atmosphere`;
  }

  private generateCharacter(genre: StoryGenre, template: string): string {
    const characters: Record<StoryGenre, string[]> = {
      horror: ['A malevolent presence lurks nearby', 'Shadows take on forms of their own', 'An ancient evil stirs'],
      mystery: ['Clues appear in unexpected places', 'A mysterious figure watches from afar', 'Evidence points to the impossible'],
      romance: ['A gentle spirit reaches out across the veil', 'Love transcends the boundary of death', 'Two souls recognize each other'],
      adventure: ['A mystical guide appears', 'The spirit realm beckons', 'Ancient powers awaken'],
      psychological: ['Reality begins to shift and bend', 'The mind struggles with new perceptions', 'Truth and illusion merge'],
      gothic: ['The weight of history presses down', 'Ancestral voices whisper secrets', 'Time itself seems suspended'],
      supernatural: ['Otherworldly energies gather', 'The veil between worlds grows thin', 'Spiritual forces converge'],
      thriller: ['Danger approaches from beyond', 'Time is running out', 'The supernatural pursuit begins']
    };
    
    const genreChars = characters[genre] || ['Something supernatural stirs'];
    return genreChars[Math.floor(Math.random() * genreChars.length)];
  }

  private generateConflict(genre: StoryGenre, mood: StoryMood, template: string): string {
    const conflicts: Record<StoryGenre, string[]> = {
      horror: ['What unspeakable horror will be unleashed?', 'Can sanity survive what lurks in the darkness?', 'Will evil claim another soul?'],
      mystery: ['What truth lies hidden in the supernatural mystery?', 'Can the puzzle be solved before it\'s too late?', 'What secrets will the investigation reveal?'],
      romance: ['Can love conquer even death itself?', 'Will two hearts find peace across the divide?', 'Can true love break the curse of separation?'],
      adventure: ['What challenges await in the mystical journey ahead?', 'Will courage be enough to face the unknown?', 'What wonders and perils lie beyond?'],
      psychological: ['Can the mind distinguish reality from illusion?', 'What truths lie buried in the psyche?', 'Will consciousness survive the supernatural encounter?'],
      gothic: ['What family secrets will come to light?', 'Can the curse of the past be broken?', 'Will tradition triumph over change?'],
      supernatural: ['What powers will be awakened?', 'Can mortal understanding grasp the otherworldly truth?', 'Will the supernatural forces be friend or foe?'],
      thriller: ['Can escape be found from the supernatural pursuit?', 'Will time run out before safety is reached?', 'What price will survival demand?']
    };
    
    const genreConflicts = conflicts[genre] || ['What will this supernatural encounter reveal?'];
    return genreConflicts[Math.floor(Math.random() * genreConflicts.length)];
  }

  private getStoryStructure(length: StoryLength): { totalParts: number; isMultiPart: boolean } {
    switch (length) {
      case 'short':
        return { totalParts: 1, isMultiPart: false };
      case 'medium':
        return { totalParts: 3, isMultiPart: true };
      case 'long':
        return { totalParts: 5, isMultiPart: true };
      default:
        return { totalParts: 1, isMultiPart: false };
    }
  }

  private generateChoicesForStoryLength(genre: StoryGenre, mood: StoryMood, length: StoryLength, currentPart: number, totalParts: number): StoryChoice[] {
    const baseChoices = [
      {
        id: 'choice-1',
        text: 'Enter the mysterious building',
        nextSegmentId: 'custom-continue-1',
        consequenceMood: 'brave' as ConsequenceMood
      },
      {
        id: 'choice-2', 
        text: 'Observe from a safe distance',
        nextSegmentId: 'custom-continue-2',
        consequenceMood: 'cautious' as ConsequenceMood
      },
      {
        id: 'choice-3',
        text: 'Call out to any spirits present',
        nextSegmentId: 'custom-continue-3',
        consequenceMood: 'curious' as ConsequenceMood
      }
    ];

    // For multi-part stories, add a continue option
    if (totalParts > 1 && currentPart < totalParts) {
      baseChoices.push({
        id: 'continue-next-part',
        text: `Continue to Part ${currentPart + 1}`,
        nextSegmentId: `custom-part-${currentPart + 1}`,
        consequenceMood: 'curious' as ConsequenceMood
      });
    }

    // Ensure there's always at least one continue option for medium/long stories
    if (length !== 'short' && !baseChoices.some(choice => choice.text.toLowerCase().includes('continue'))) {
      baseChoices.push({
        id: 'continue-story',
        text: 'Continue the story',
        nextSegmentId: 'continue',
        consequenceMood: 'curious' as ConsequenceMood
      });
    }

    return baseChoices;
  }

  // New method to handle story continuation
  async continueStoryPart(sessionId: string): Promise<{ segment: StorySegment; currentPart: number; totalParts: number; storyLength: StoryLength; isStoryActive: boolean } | null> {
    const activeStory = this.activeStories.get(sessionId);
    
    if (!activeStory || !activeStory.isMultiPart || !activeStory.currentPart || !activeStory.totalParts) {
      return null;
    }

    const nextPart = activeStory.currentPart + 1;
    
    if (nextPart > activeStory.totalParts) {
      // Story is complete - generate a unique ending
      const endingVariations = [
        'The ghost steps back into the shadows, your tale now complete. The echoes of your choices will linger in the ethereal realm forever...',
        'As the final chapter closes, the spirits whisper their gratitude for sharing in your story. The supernatural realm remembers...',
        'Your journey through the otherworld reaches its end, but the connections forged will endure beyond the veil of reality...',
        'The tale concludes as all great stories must, but the magic created will continue to ripple through dimensions unseen...',
        'With the story\'s completion, you feel the presence of countless spirits who have witnessed your journey and found meaning in your choices...'
      ];
      
      const randomEnding = endingVariations[Math.floor(Math.random() * endingVariations.length)];
      
      // Mark story as completed to prevent repetition
      this.completeStory(sessionId);
      
      return {
        segment: {
          id: 'story-complete',
          text: randomEnding,
          choices: [],
          mood: activeStory.selectedMood,
          atmosphere: 'A sense of completion and transcendent mystery',
          emotionalIntensity: 'low'
        },
        currentPart: activeStory.totalParts,
        totalParts: activeStory.totalParts,
        storyLength: activeStory.storyLength || 'medium',
        isStoryActive: false
      };
    }

    // Generate next part content
    const nextPartContent = this.generateNextPartContent(
      activeStory.selectedGenre, 
      activeStory.selectedMood, 
      activeStory.storyLength || 'medium',
      activeStory.personalizedElements[0] || 'traveler',
      nextPart, 
      activeStory.totalParts
    );

    const nextSegment: StorySegment = {
      id: `custom-part-${nextPart}`,
      text: nextPartContent,
      choices: this.generateChoicesForStoryLength(
        activeStory.selectedGenre, 
        activeStory.selectedMood, 
        activeStory.storyLength || 'medium', 
        nextPart, 
        activeStory.totalParts
      ),
      mood: activeStory.selectedMood,
      atmosphere: this.getAtmosphereForMood(activeStory.selectedMood),
      emotionalIntensity: 'medium'
    };

    // Update active story
    activeStory.currentPart = nextPart;
    activeStory.currentSegmentId = nextSegment.id;

    return {
      segment: nextSegment,
      currentPart: nextPart,
      totalParts: activeStory.totalParts,
      storyLength: activeStory.storyLength || 'medium',
      isStoryActive: true
    };
  }

  private generateNextPartContent(genre: StoryGenre, mood: StoryMood, length: StoryLength, playerName: string, currentPart: number, totalParts: number): string {
    const sessionKey = `${genre}-${mood}`;
    const template = this.getUniqueStoryTemplate(genre, sessionKey);
    
    // Generate dynamic progression based on the story template and part number
    const progression = this.generatePartProgression(genre, mood, template, currentPart, totalParts);
    const storyArc = this.getStoryArc(currentPart, totalParts);
    const dynamicElements = this.generateDynamicElements(genre, mood, currentPart);
    
    let content = `${progression} ${storyArc} ${dynamicElements}`;
    
    // Add part indicator
    content += `\n\n*Part ${currentPart} of ${totalParts}*`;

    return content;
  }

  private generatePartProgression(genre: StoryGenre, mood: StoryMood, template: string, currentPart: number, totalParts: number): string {
    const progressionTemplates: Record<StoryGenre, Record<number, string[]>> = {
      horror: {
        2: [
          'The supernatural presence grows stronger, manifesting in increasingly terrifying ways',
          'Ancient evil awakens from its slumber, hungry for souls to claim',
          'The boundary between reality and nightmare dissolves completely',
          'Malevolent forces gather, preparing for their final assault on sanity'
        ],
        3: [
          'The horror reaches its peak as the truth behind the haunting is revealed',
          'A final confrontation with pure evil determines the fate of all involved',
          'The climactic battle between good and evil reaches its terrifying conclusion',
          'The ultimate horror emerges from the shadows for the final encounter'
        ],
        4: [
          'The aftermath of terror leaves permanent scars on reality itself',
          'New mysteries emerge from the ashes of the previous horror',
          'The evil adapts and evolves, becoming something far worse than before',
          'Hope and despair wage war in the ruins of what once was normal'
        ],
        5: [
          'The final revelation reshapes everything previously understood about the horror',
          'In the ultimate confrontation, the very nature of evil is challenged',
          'The conclusion brings either salvation or eternal damnation',
          'The last chapter writes itself in blood and shadow'
        ]
      },
      mystery: {
        2: [
          'New clues emerge that contradict everything previously discovered',
          'The investigation takes an unexpected turn as hidden connections surface',
          'A breakthrough revelation changes the entire direction of the mystery',
          'The puzzle pieces begin forming a picture more complex than imagined'
        ],
        3: [
          'The truth behind the mystery is more shocking than anyone could have predicted',
          'All the clues finally converge to reveal the stunning conclusion',
          'The final piece of the puzzle unlocks the entire mystery',
          'Justice and revelation arrive in an unexpected climax'
        ],
        4: [
          'The resolution of one mystery reveals the existence of an even deeper conspiracy',
          'New questions arise from the ashes of the solved case',
          'The truth proves to be just the tip of an enormous iceberg',
          'Victory feels hollow as greater mysteries loom on the horizon'
        ],
        5: [
          'The ultimate truth ties together all the previous mysteries in an epic conclusion',
          'The final revelation explains not just the crime, but the nature of truth itself',
          'In the end, solving the mystery becomes a journey of self-discovery',
          'The last clue reveals that the greatest mystery was within all along'
        ]
      },
      romance: {
        2: [
          'The spiritual connection deepens as two souls recognize their eternal bond',
          'Love transcends the boundaries between life and death in beautiful ways',
          'The romantic tension builds as supernatural forces either help or hinder the connection',
          'Hearts begin to heal across the divide that separates the living and the dead'
        ],
        3: [
          'True love proves stronger than death itself in a climactic romantic revelation',
          'The power of eternal love reshapes reality to allow the impossible',
          'Two hearts finally unite, creating a love story for the ages',
          'The romantic conclusion proves that some bonds can never be broken'
        ],
        4: [
          'The established love faces new challenges that test its eternal strength',
          'Supernatural romance evolves into something even more profound and beautiful',
          'Love conquers new obstacles and grows stronger with each victory',
          'The romantic journey continues into uncharted emotional territory'
        ],
        5: [
          'The ultimate love story concludes with a romance that reshapes the very nature of existence',
          'Eternal love becomes a force that transforms not just two hearts, but the entire world',
          'The final romantic revelation proves love truly is the most powerful force in any realm',
          'Two souls achieve a unity that becomes legend for all who hear their story'
        ]
      },
      adventure: {
        2: [
          'The mystical journey leads to realms where magic and wonder rule supreme',
          'New allies and enemies emerge as the adventure takes increasingly dangerous turns',
          'The quest reveals hidden powers and abilities that change everything',
          'Ancient mysteries unfold as the adventure reaches its most challenging phase'
        ],
        3: [
          'The climactic adventure tests every skill and courage gained along the journey',
          'The final quest challenges not just physical abilities but the very essence of heroism',
          'In the ultimate adventure, the fate of multiple worlds hangs in the balance',
          'The conclusion of the quest brings rewards beyond imagination'
        ],
        4: [
          'New adventures emerge from the success of the previous quest',
          'The hero\'s journey continues into even more wondrous and dangerous realms',
          'Greater challenges arise that require all the wisdom gained from past adventures',
          'The adventure evolves as new mysteries and wonders await discovery'
        ],
        5: [
          'The ultimate adventure reshapes the hero\'s understanding of their true purpose',
          'In the final quest, the adventurer becomes legend through their incredible journey',
          'The epic conclusion proves that the greatest adventures transform not just the world, but the soul',
          'The last chapter of the adventure opens doorways to infinite possibilities'
        ]
      },
      psychological: {
        2: [
          'The line between reality and illusion becomes increasingly blurred and dangerous',
          'Deep psychological truths surface as the mind grapples with supernatural forces',
          'Mental barriers break down, revealing disturbing connections between psyche and spirit',
          'The exploration of consciousness takes terrifying and enlightening turns'
        ],
        3: [
          'The psychological climax forces a confrontation with the deepest fears and truths',
          'Reality reassembles itself as the mind finally grasps the true nature of the experience',
          'The final psychological breakthrough either brings salvation or complete mental breakdown',
          'Consciousness itself becomes the battlefield for the ultimate confrontation'
        ],
        4: [
          'New layers of psychological complexity emerge from the resolved crisis',
          'The mind adapts to its new understanding, but greater challenges await',
          'Psychological evolution continues as deeper truths about consciousness surface',
          'Mental barriers transform into doorways to previously unimaginable realms'
        ],
        5: [
          'The ultimate psychological revelation transforms the very nature of self-understanding',
          'In the final analysis, the journey becomes one of complete psychological transformation',
          'The mind achieves a new level of consciousness that transcends previous limitations',
          'The psychological conclusion redefines what it means to be truly aware'
        ]
      },
      gothic: {
        2: [
          'Family secrets buried for generations finally claw their way to the surface',
          'The weight of history and tradition creates pressure that threatens to crush the present',
          'Gothic romance and horror intertwine in increasingly complex patterns',
          'Ancestral sins demand payment as the past refuses to remain buried'
        ],
        3: [
          'The gothic climax reveals the full scope of the family curse and its terrible price',
          'Tradition and modernity clash in a final battle for the soul of the bloodline',
          'The gothic conclusion either breaks the cycle of ancestral doom or perpetuates it',
          'In true gothic fashion, victory comes with a price that echoes through eternity'
        ],
        4: [
          'The gothic tradition evolves as new chapters of the family saga unfold',
          'Ancient bloodlines adapt to modern times while carrying their historical burdens',
          'Gothic themes deepen as the family legacy becomes even more complex',
          'The past and present merge in ways that create new gothic mysteries'
        ],
        5: [
          'The ultimate gothic revelation reshapes the entire understanding of family, tradition, and destiny',
          'In the final gothic confrontation, the very nature of heritage and legacy is challenged',
          'The conclusion proves that some gothic traditions transcend time itself',
          'The final chapter writes a new beginning for an ancient gothic legacy'
        ]
      },
      supernatural: {
        2: [
          'Supernatural abilities manifest as the connection to the otherworld strengthens',
          'The spirit realm reveals its complex hierarchy and ancient laws',
          'New supernatural allies and enemies emerge as cosmic forces take notice',
          'The supernatural journey leads to realms where normal laws no longer apply'
        ],
        3: [
          'The supernatural climax tests newly awakened powers against cosmic threats',
          'The final supernatural confrontation determines the fate of multiple realms',
          'In the ultimate supernatural battle, the balance between worlds hangs by a thread',
          'The supernatural conclusion reshapes the relationship between the mortal and spirit worlds'
        ],
        4: [
          'Greater supernatural responsibilities emerge from the victory over cosmic threats',
          'The supernatural journey continues into realms of even greater power and mystery',
          'New supernatural challenges test the evolved abilities and wisdom gained',
          'The supernatural path leads to understanding of universal cosmic truths'
        ],
        5: [
          'The ultimate supernatural revelation explains the true nature of existence itself',
          'In the final supernatural ascension, mortal understanding transcends all previous limitations',
          'The supernatural conclusion bridges all worlds and realms in perfect harmony',
          'The final supernatural truth reveals that all existence is connected in ways beyond imagination'
        ]
      },
      thriller: {
        2: [
          'The supernatural pursuit intensifies as the stakes reach life-threatening levels',
          'New threats emerge that make the previous dangers seem trivial by comparison',
          'The chase evolves into a deadly game where survival requires constant adaptation',
          'Supernatural forces gather for an assault that threatens reality itself'
        ],
        3: [
          'The thrilling climax pushes every survival instinct to its absolute limit',
          'The final supernatural chase tests courage, wit, and determination in equal measure',
          'In the ultimate thriller confrontation, only the strongest will survive the ordeal',
          'The conclusion brings either triumphant victory or devastating defeat'
        ],
        4: [
          'New supernatural threats emerge from the shadows of the previous victory',
          'The thriller evolves as greater dangers require even more desperate measures',
          'Survival becomes an art form as supernatural predators adapt their hunting strategies',
          'The stakes escalate beyond personal survival to encompass the fate of many'
        ],
        5: [
          'The ultimate supernatural thriller tests every skill learned and every alliance forged',
          'In the final supernatural confrontation, the very nature of survival is redefined',
          'The thrilling conclusion proves that some victories require the ultimate sacrifice',
          'The last chapter of the supernatural thriller becomes legend among survivors'
        ]
      }
    };
    
    const genreProgressions = progressionTemplates[genre] || {};
    const partProgressions = genreProgressions[currentPart] || ['The story continues in unexpected ways...'];
    
    return partProgressions[Math.floor(Math.random() * partProgressions.length)];
  }

  private getStoryArc(currentPart: number, totalParts: number): string {
    const arcPosition = currentPart / totalParts;
    
    if (arcPosition <= 0.33) {
      return 'The foundation of the tale grows stronger with each revelation.';
    } else if (arcPosition <= 0.66) {
      return 'The story reaches its turning point as crucial elements converge.';
    } else if (arcPosition < 1.0) {
      return 'All threads weave together toward the inevitable climax.';
    } else {
      return 'The final chapter brings resolution to all that came before.';
    }
  }

  private generateDynamicElements(genre: StoryGenre, mood: StoryMood, currentPart: number): string {
    const elements = [
      'Unexpected allies reveal themselves at the crucial moment.',
      'Hidden connections between past and present become clear.',
      'The true nature of the supernatural forces is finally revealed.',
      'A twist in the tale changes everything previously understood.',
      'New mysteries emerge from the resolution of old ones.',
      'The stakes escalate beyond anything previously imagined.',
      'Ancient prophecies begin to fulfill themselves in modern times.',
      'The boundary between possible and impossible continues to blur.',
      'Choices made in the past create consequences in the present.',
      'The supernatural world proves to be vast beyond comprehension.'
    ];
    
    return elements[Math.floor(Math.random() * elements.length)];
  }

  private getAtmosphereForMood(mood: StoryMood): string {
    const atmospheres: Record<StoryMood, string> = {
      mysterious: 'ethereal and enigmatic',
      frightening: 'terrifying and oppressive',
      romantic: 'passionate and otherworldly',
      dark: 'shadowy and foreboding', 
      hopeful: 'uplifting yet supernatural',
      melancholic: 'sorrowful and haunting',
      suspenseful: 'tense and anticipatory',
      whimsical: 'playful and magical',
      intense: 'overwhelming and powerful',
      peaceful: 'serene and spiritual'
    };
    
    return atmospheres[mood];
  }

  // New method to handle story completion and prevent immediate repetition
  completeStory(sessionId: string): void {
    const activeStory = this.activeStories.get(sessionId);
    if (activeStory) {
      // Mark story elements as used to prevent immediate repetition
      const sessionKey = `${activeStory.selectedGenre}-${activeStory.selectedMood}`;
      this.markStoryAsCompleted(sessionKey, activeStory.storyId);
      
      // Remove from active stories
      this.activeStories.delete(sessionId);
    }
  }

  private markStoryAsCompleted(sessionKey: string, storyId: string): void {
    if (!this.usedStoryElements.has(sessionKey)) {
      this.usedStoryElements.set(sessionKey, new Set());
    }
    
    const usedElements = this.usedStoryElements.get(sessionKey)!;
    usedElements.add(storyId);
  }

  // Method to clear used story elements for a fresh experience
  resetStoryPool(genre?: StoryGenre, mood?: StoryMood): void {
    if (genre && mood) {
      const sessionKey = `${genre}-${mood}`;
      this.usedStoryElements.delete(sessionKey);
    } else {
      this.usedStoryElements.clear();
    }
  }

  // Get story variety statistics for debugging
  getStoryVarietyInfo(genre: StoryGenre): { total: number, used: number, remaining: number } {
    const templates = this.storyTemplates.get(genre) || [];
    const sessionKey = `${genre}-any`;
    const used = this.usedStoryElements.get(sessionKey)?.size || 0;
    
    return {
      total: templates.length,
      used: used,
      remaining: templates.length - used
    };
  }
}

export default StorytellingSystem;