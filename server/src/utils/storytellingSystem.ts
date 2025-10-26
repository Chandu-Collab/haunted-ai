export interface StorySegment {
  id: string;
  text: string;
  choices: StoryChoice[];
  mood: 'suspenseful' | 'mysterious' | 'frightening' | 'melancholic' | 'hopeful';
  atmosphere: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  nextSegmentId: string;
  consequenceMood: 'brave' | 'curious' | 'cautious' | 'fearful';
}

export interface ActiveStory {
  storyId: string;
  currentSegmentId: string;
  userChoices: string[];
  personalizedElements: string[];
  sessionId: string;
  startedAt: Date;
}

export class StorytellingSystem {
  private activeStories: Map<string, ActiveStory> = new Map();
  
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
        atmosphere: 'A storm rages outside, casting eerie shadows through the windows'
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
}

export default StorytellingSystem;