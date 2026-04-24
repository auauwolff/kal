# Kal Your Fitness Pal - Complete App Specifications

## Overview
Kal Your Fitness Pal is a gamified fitness companion app featuring a digital pet (Kal) that evolves alongside the user's fitness journey. Think Tamagotchi meets fitness tracking - your pet reflects your health and fitness progress.

## Core Concept
- **Digital Fitness Pet**: Kal is a virtual companion that changes appearance and characteristics based on user's fitness metrics
- **Fitness Journey Companion**: Pet evolves as user loses weight, gains muscle, improves health markers
- **Gamification**: Turn fitness goals into engaging pet care mechanics
- **Social Elements**: Share pet progress and compete with friends

## Key Features

### 1. Pet System
- **Dynamic Appearance**: Kal's size, color, and accessories change based on user metrics
- **Personality Traits**: Pet develops characteristics matching user's fitness profile
- **Evolution Stages**: Different pet forms unlocked through fitness milestones
- **Mood System**: Pet happiness affected by consistency, goal achievement
- **Animations**: Interactive pet responds to user actions and achievements
- **Interactive Eye Tracking**: Pet's pupils follow user's mouse cursor for enhanced interactivity
- **Natural Blinking Animation**: Realistic eye blinking every 4 seconds with natural timing

### 2. User Profile & Stats
- **Basic Metrics**: Weight, height, age, gender
- **Goal Setting**: Weight loss/gain targets, activity goals
- **Progress Tracking**: Historical data with charts and trends
- **Health Markers**: Body fat percentage, muscle mass (optional)
- **Activity Integration**: Steps, workouts, sleep data

### 3. Nutrition Tracking
- **Photo-Based Food Logging**: Take photos of meals to feed Kal
- **AI Food Recognition**: Automatic calorie and macro estimation
- **Meal Planning**: Suggest meals that keep Kal healthy
- **Nutrition Education**: Tips and insights through Kal's reactions
- **Calorie Balance**: Visual feedback through pet's energy levels

### 4. Fitness Integration
- **Workout Logging**: Manual entry and fitness app integration
- **Activity Recognition**: Automatic step counting, movement detection
- **Exercise Library**: Workouts that benefit both user and pet
- **Streak Tracking**: Consistency rewards for user and pet
- **Challenge System**: Daily/weekly fitness challenges

### 5. Pet Shop & Customization
- **Accessories**: Hats, clothes, glasses earned through achievements
- **Colors & Themes**: Unlock new pet colors and visual styles
- **Backgrounds**: Different environments for pet display
- **Currency System**: Earn coins through fitness activities
- **Limited Items**: Special seasonal or achievement-based items

### 6. Social Features
- **Pet Sharing**: Post pet photos/videos to social feeds
- **Friend System**: Connect with friends, see their pets
- **Competitions**: Weekly challenges, leaderboards
- **Community**: Forums, tips sharing, motivation
- **Pet Playdates**: Virtual interactions between friends' pets

### 7. Streak & Achievement System
- **Daily Streaks**: Login, exercise, nutrition logging
- **Milestone Badges**: Weight loss goals, workout consistency
- **Special Achievements**: Creative challenges and rare accomplishments
- **Progress Celebrations**: Pet animations and rewards for milestones
- **Sharing Achievements**: Social media integration for accomplishments

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Zustand for global state
- **UI Library**: Material-UI or Tailwind CSS
- **Animations**: Framer Motion for pet animations
- **Camera Integration**: Native camera APIs for meal photos
- **Charts**: Recharts or similar for progress visualization
- **SVG Graphics**: Inline SVG components with forwardRef for direct DOM manipulation
- **CSS Animations**: Keyframe animations for natural eye blinking and interactions
- **Mouse Tracking**: Real-time pupil movement based on cursor position

### Backend (Convex)
- **Real-time Database**: Convex for user data, pet states
- **File Storage**: Convex file storage for meal photos, pet assets
- **Authentication**: Convex Auth with social login options
- **Functions**: Serverless functions for AI processing, calculations
- **Push Notifications**: Achievement alerts, reminder notifications

### AI & Machine Learning
- **Food Recognition API**: Google Vision API or similar
- **Calorie Estimation**: Nutrition databases (USDA, etc.)
- **Smart Suggestions**: ML-powered meal and exercise recommendations
- **Progress Analysis**: Trend analysis and personalized insights

### Data Models

#### User Profile
```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  height: number; // cm
  currentWeight: number; // kg
  goalWeight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: string[]; // weight_loss, muscle_gain, maintenance
  createdAt: Date;
  timezone: string;
}
```

#### Pet State
```typescript
interface PetState {
  userId: string;
  name: string;
  level: number;
  experience: number;
  happiness: number;
  health: number;
  size: number; // 0.5-2.0 scale factor
  color: string; // hex color
  accessories: string[]; // accessory IDs
  currentAnimation: string;
  evolutionStage: number;
  lastFed: Date;
  lastExercised: Date;
  updatedAt: Date;
}
```

#### Health Metrics
```typescript
interface HealthMetric {
  userId: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  steps?: number;
  caloriesConsumed?: number;
  caloriesBurned?: number;
  workoutMinutes?: number;
  sleepHours?: number;
}
```

#### Meal Entry
```typescript
interface MealEntry {
  userId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  photoUrl?: string;
  foodItems: FoodItem[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  aiConfidence?: number;
}
```

#### Achievement System
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  type: 'streak' | 'milestone' | 'special';
  requirements: {
    metric: string;
    target: number;
    timeframe?: string;
  };
  rewards: {
    experience: number;
    coins: number;
    unlockedItems?: string[];
  };
}
```

## Pet Evolution Logic

### Size Dynamics
- **Weight Loss**: Pet gets smaller, more energetic
- **Weight Gain**: Pet grows larger (context matters - muscle vs fat)
- **Muscle Gain**: Pet becomes more defined, stronger appearance
- **Fitness Level**: Affects pet's energy and animation speed

### Color & Appearance
- **Health Status**: Vibrant colors for good health, dull for poor health
- **Nutrition Quality**: Good nutrition = healthy glow, poor nutrition = less vibrant
- **Hydration**: Affects pet's skin texture and brightness
- **Sleep Quality**: Eye brightness, overall alertness

### Mood & Personality
- **Consistency**: Regular users have happier, more animated pets
- **Goal Achievement**: Success breeds confident, proud pet behavior
- **Social Interaction**: Sharing and friend connections improve pet's social traits
- **Challenge Participation**: Active users have more adventurous pets

## Monetization Strategy

### Premium Features
- **Advanced Analytics**: Detailed health insights and trends
- **Unlimited Pet Customization**: Exclusive accessories and colors
- **AI Nutrition Coach**: Personalized meal plans and suggestions
- **Social Features**: Groups, advanced friend features
- **Data Export**: Comprehensive health data exports

### Freemium Model
- **Free Tier**: Basic pet, limited customization, core tracking
- **Premium Tier**: Full customization, advanced features, AI coaching
- **One-time Purchases**: Special accessories, themes, premium pets

## Development Roadmap

### Phase 1: MVP (Core Pet System)
- Basic pet display with simple evolution
- User profile and weight tracking
- Simple meal logging (no AI)
- Achievement system foundation

### Phase 2: Enhanced Tracking
- Photo-based meal logging with AI
- Fitness integration
- Social features (friends, sharing)
- Pet shop with basic items

### Phase 3: Advanced Features
- Machine learning insights
- Advanced health metrics
- Community features
- Premium subscription features

### Phase 4: Ecosystem Expansion
- Wearable device integration
- Third-party fitness app connections
- Corporate wellness programs
- API for developers

## Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Session length and frequency
- Pet interaction rates
- Feature adoption rates

### Health Outcomes
- User weight goal achievement rates
- Consistency in logging (streaks)
- Improvement in health metrics
- User-reported satisfaction

### Business Metrics
- User acquisition cost (CAC)
- Lifetime value (LTV)
- Premium conversion rates
- Revenue per user

## Future Enhancements

### Advanced AI
- Predictive health analytics
- Personalized coaching recommendations
- Smart goal adjustments
- Behavioral pattern recognition

### Expanded Pet System
- Multiple pets per user
- Pet breeding and evolution
- Seasonal events and limited pets
- Pet competitions and tournaments

### Health Integration
- Medical provider partnerships
- Prescription medication reminders
- Chronic condition management
- Mental health tracking integration

---

## Implementation Notes

### Interactive Pet Animation System
The current prototype includes a sophisticated eye tracking and animation system:

#### Eye Tracking Implementation
- **Mouse Event Handling**: Global mouse move listeners calculate cursor position relative to SVG center
- **Pupil Movement**: Real-time translation transforms applied to white pupil highlights (`#leftEyePupil`, `#rightEyePupil`)
- **Movement Constraints**: Limited to 2px radius for realistic eye movement
- **Smooth Transitions**: CSS transitions (0.1s ease-out) for natural pupil movement

#### Blinking Animation System
- **Natural Timing**: Keyframe animation with 4-second intervals
- **Realistic Sequence**: 94%-96%-98% keyframes create natural blink timing
- **Synchronized Eyes**: Both eyes blink simultaneously for realistic behavior
- **CSS Implementation**: ScaleY transforms with proper transform-origins

#### Technical Architecture
```typescript
// Component Structure
KalSvg: React.forwardRef<SVGSVGElement> // Inline SVG with proper IDs
CalPet: Mouse tracking useEffect with direct SVG ref access
CalStore: Zustand store for pet state management

// Animation Separation
- Blinking: Applied to eye whites and blacks (#leftEyeWhite, #leftEyeBlack)
- Mouse tracking: Applied only to pupils (#leftEyePupil, #rightEyePupil)
- No animation conflicts: Separate transform targets
```

#### Key Lessons for Full App
1. **SVG Ref Management**: Use React.forwardRef for direct SVG DOM access
2. **Animation Separation**: Keep different animations on separate elements
3. **Performance**: Limit mouse event calculations and use CSS transitions
4. **Visual Hierarchy**: Pupil highlights create more noticeable tracking than full eye movement

---

## Pet Outfit & Accessory System

### Architecture: Layered SVG Approach

The recommended implementation uses a modular layered SVG system for maximum flexibility and maintainability.

#### Core Design Principles
- **Modular Components**: Each accessory is a separate SVG component
- **Layered Rendering**: Accessories layer on top of base KalSvg component  
- **Position Absolute**: Accessories use absolute positioning to overlay precisely
- **Scalable System**: Easy to add new accessories without affecting base pet

#### Technical Implementation
```typescript
// Component Structure
<Box sx={{ position: 'relative' }}>
  <KalSvg ref={svgRef} /> {/* Base layer - existing pet */}
  {equippedAccessories.hat && <KalAccessoryHat />}
  {equippedAccessories.glasses && <KalAccessoryGlasses />}
  {equippedAccessories.bowtie && <KalAccessoryBowtie />}
</Box>

// Accessory Component Pattern
const KalAccessoryHat = () => (
  <svg 
    style={{ position: 'absolute', top: 0, left: 0 }}
    width="218" height="230" 
    viewBox="0 0 218 230"
  >
    <path d="..." fill="#FF0000" /> {/* Hat design paths */}
  </svg>
);
```

#### Accessory Attachment Points
Based on current KalSvg viewBox="0 0 218 230":

- **Hat/Cap**: Top area (y: 0-50) - above head region
- **Glasses**: Eye area (y: 65-110, x: 60-160) - overlay on eyes
- **Bowtie/Necklace**: Neck area (y: 120-140) - below head, above body  
- **Earrings**: Side of head (x: 50-60, 160-170, y: 80-100) - near ears

#### Store Integration with KalStore
```typescript
// Extended KalState Interface
interface KalState {
  // Existing properties...
  userStats: UserStats;
  petState: PetState;
  
  // New outfit system
  availableAccessories: AccessoryItem[];
  equippedAccessories: EquippedAccessories;
  kalCoins: number; // Currency for purchases
  
  // New actions
  purchaseAccessory: (accessoryId: string) => void;
  equipAccessory: (category: AccessoryCategory, accessoryId: string) => void;
  unequipAccessory: (category: AccessoryCategory) => void;
  earnCoins: (amount: number) => void;
}

// Accessory Data Models
interface AccessoryItem {
  id: string;
  name: string;
  category: 'hat' | 'glasses' | 'bowtie' | 'earrings';
  price: number;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel?: number; // Pet level requirement
  svgComponent: React.ComponentType; // Accessory component
}

interface EquippedAccessories {
  hat?: string;
  glasses?: string;  
  bowtie?: string;
  earrings?: string;
}
```

#### Implementation Phases
1. **Phase 1**: Extend KalStore with outfit system state and actions
2. **Phase 2**: Create first sample accessory (cap) to test layered approach
3. **Phase 3**: Build outfit store UI (purchase/equip interface)
4. **Phase 4**: Add coin earning system from pet interactions (feed/exercise)
5. **Phase 5**: Expand with rarity system and multiple accessories

#### Advantages Over Single SVG Approach
- ✅ **No File Explosion**: Avoid exponential SVG variants for combinations
- ✅ **Animation Preservation**: Base pet animations remain intact
- ✅ **Easy Maintenance**: Update accessories independently of base design
- ✅ **Performance**: Only load equipped accessories, not all variants
- ✅ **Scalability**: Add unlimited accessories without complexity growth

#### Currency & Economy Design
- **Kal Coins**: Earned through pet interactions (feed +5 coins, exercise +10 coins)
- **Pricing Tiers**: Common (50 coins), Rare (150 coins), Epic (500 coins), Legendary (1000 coins)
- **Level Gates**: Some accessories require minimum pet levels
- **Achievement Unlocks**: Special accessories earned through milestones

---

**Note**: This specification document serves as the blueprint for the standalone Kal Your Fitness Pal app. The current implementation in the Clocker project is a temporary prototype for testing UI/UX concepts before building the full application.