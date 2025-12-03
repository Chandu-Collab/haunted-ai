export type StoryGenre = 'horror' | 'mystery' | 'romance' | 'adventure' | 'psychological' | 'gothic' | 'supernatural' | 'thriller';
export type StoryMood = 'suspenseful' | 'mysterious' | 'frightening' | 'melancholic' | 'hopeful' | 'romantic' | 'dark' | 'whimsical' | 'intense' | 'peaceful';
export type ConsequenceMood = 'brave' | 'curious' | 'cautious' | 'fearful' | 'compassionate' | 'aggressive' | 'playful';

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
  dynamicElements: {
    userPreferences: string[];
    moodProgression: StoryMood[];
    interactionHistory: string[];
  };
}

export class StorytellingSystem {
  private activeStories: Map<string, ActiveStory> = new Map();
  
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
    playerName: string;
    sessionId: string;
  }): Promise<ActiveStory | null> {
    try {
      const { genre, mood, playerName, sessionId } = preferences;
      
      // Create custom story metadata
      const customStoryId = `custom-${genre}-${mood}-${Date.now()}`;
      const storyTitle = this.generateStoryTitle(genre, mood);
      
      // Generate initial story content based on preferences
      const initialContent = this.generateInitialStoryContent(genre, mood, playerName);
      
      // Create story segment
      const initialSegment: StorySegment = {
        id: 'custom-start-1',
        text: initialContent,
        choices: this.generateChoicesForGenreAndMood(genre, mood),
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
        dynamicElements: {
          userPreferences: [genre, mood],
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

  private generateInitialStoryContent(genre: StoryGenre, mood: StoryMood, playerName: string): string {
    const genreIntros: Record<StoryGenre, string> = {
      horror: `${playerName} approaches a decrepit mansion under the pale moonlight, its windows like hollow eyes watching your every step. The wind carries whispers of the long dead...`,
      mystery: `${playerName} receives a cryptic letter leading to an abandoned estate where secrets lie buried beneath layers of time and dust...`,
      romance: `${playerName} discovers an old love letter in the attic, its words speaking of a passion that transcends death itself...`,
      adventure: `${playerName} stands at the threshold of an otherworldly journey, where spirits guide and danger lurks in ethereal shadows...`,
      psychological: `${playerName}'s mind begins to blur the lines between reality and the supernatural, as ghostly voices echo thoughts you've never spoken...`,
      gothic: `${playerName} enters a cathedral of shadows where gargoyles weep stone tears and the very architecture seems alive with spectral energy...`,
      supernatural: `${playerName} crosses into a realm where the veil between worlds grows thin, and phantoms walk among the living...`,
      thriller: `${playerName} races against time in a supernatural chase where ghostly pursuers follow your every move through the ethereal plane...`
    };
    
    const moodModifiers: Record<StoryMood, string> = {
      mysterious: ' Ancient symbols glow faintly on the walls, their meaning lost to mortal understanding.',
      frightening: ' Terror grips your heart as shadows move with malevolent intent.',
      romantic: ' The air shimmers with the essence of eternal love, beautiful and haunting.',
      dark: ' Oppressive darkness seems to have its own consciousness, watching and waiting.',
      hopeful: ' Despite the supernatural atmosphere, a gentle warmth suggests protection from benevolent spirits.',
      melancholic: ' A profound sadness permeates the air, the weight of countless untold stories.',
      suspenseful: ' Every creak and whisper builds tension as you sense you are not alone.',
      whimsical: ' Playful spirits dance in the moonbeams, their laughter like distant wind chimes.',
      intense: ' The supernatural energy crackles with overwhelming power, demanding your attention.',
      peaceful: ' Serene spiritual energy flows around you like a gentle, otherworldly embrace.'
    };
    
    return genreIntros[genre] + moodModifiers[mood];
  }

  private generateChoicesForGenreAndMood(genre: StoryGenre, mood: StoryMood): StoryChoice[] {
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
    
    return baseChoices;
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
}

export default StorytellingSystem;