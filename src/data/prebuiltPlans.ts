
import { PrebuiltPlanTemplate, WorkoutPlanDay, TemplateExercise } from '../types';

// Helper function to create exercises
const createExercise = (
  name: string,
  sets: number,
  reps: number | string,
  notes?: string
): TemplateExercise => ({
  name,
  targetSets: sets,
  targetReps: reps,
  notes,
});

// ===== PUSH PULL LEGS (PPL) =====
const pplPushExercises: TemplateExercise[] = [
  createExercise('Bench Press', 4, '6-8', 'Flat barbell bench'),
  createExercise('Overhead Press', 3, '8-10'),
  createExercise('Incline Dumbbell Press', 3, '10-12'),
  createExercise('Cable Flyes', 3, '12-15'),
  createExercise('Lateral Raises', 4, '12-15'),
  createExercise('Tricep Pushdowns', 3, '12-15'),
  createExercise('Overhead Tricep Extension', 3, '12-15'),
];

const pplPullExercises: TemplateExercise[] = [
  createExercise('Deadlift', 4, '5-6', 'Conventional or sumo'),
  createExercise('Pull-ups', 4, '6-10'),
  createExercise('Barbell Rows', 4, '8-10'),
  createExercise('Face Pulls', 3, '15-20'),
  createExercise('Dumbbell Rows', 3, '10-12'),
  createExercise('Barbell Curls', 3, '10-12'),
  createExercise('Hammer Curls', 3, '12-15'),
];

const pplLegsExercises: TemplateExercise[] = [
  createExercise('Squats', 4, '6-8', 'Back squat'),
  createExercise('Romanian Deadlift', 4, '8-10'),
  createExercise('Leg Press', 3, '10-12'),
  createExercise('Walking Lunges', 3, '12', 'Per leg'),
  createExercise('Leg Curls', 3, '12-15'),
  createExercise('Leg Extensions', 3, '12-15'),
  createExercise('Calf Raises', 4, '15-20'),
];

// ===== UPPER LOWER =====
const upperExercises: TemplateExercise[] = [
  createExercise('Bench Press', 4, '6-8'),
  createExercise('Barbell Rows', 4, '6-8'),
  createExercise('Overhead Press', 3, '8-10'),
  createExercise('Pull-ups', 3, '8-10'),
  createExercise('Incline Dumbbell Press', 3, '10-12'),
  createExercise('Cable Rows', 3, '10-12'),
  createExercise('Lateral Raises', 3, '12-15'),
  createExercise('Face Pulls', 3, '15-20'),
  createExercise('Bicep Curls', 2, '12-15'),
  createExercise('Tricep Pushdowns', 2, '12-15'),
];

const lowerExercises: TemplateExercise[] = [
  createExercise('Squats', 4, '6-8'),
  createExercise('Romanian Deadlift', 4, '8-10'),
  createExercise('Leg Press', 3, '10-12'),
  createExercise('Bulgarian Split Squats', 3, '10-12', 'Per leg'),
  createExercise('Leg Curls', 3, '12-15'),
  createExercise('Leg Extensions', 3, '12-15'),
  createExercise('Hip Thrusts', 3, '10-12'),
  createExercise('Calf Raises', 4, '15-20'),
];

// ===== BRO SPLIT =====
const chestExercises: TemplateExercise[] = [
  createExercise('Bench Press', 4, '6-8'),
  createExercise('Incline Dumbbell Press', 4, '8-10'),
  createExercise('Decline Bench Press', 3, '8-10'),
  createExercise('Cable Flyes', 3, '12-15'),
  createExercise('Dumbbell Flyes', 3, '12-15'),
  createExercise('Push-ups', 3, 'AMRAP', 'To failure'),
];

const backExercises: TemplateExercise[] = [
  createExercise('Deadlift', 4, '5-6'),
  createExercise('Pull-ups', 4, '8-10'),
  createExercise('Barbell Rows', 4, '8-10'),
  createExercise('Lat Pulldown', 3, '10-12'),
  createExercise('Seated Cable Rows', 3, '10-12'),
  createExercise('Single Arm Dumbbell Rows', 3, '10-12'),
  createExercise('Face Pulls', 3, '15-20'),
];

const shoulderExercises: TemplateExercise[] = [
  createExercise('Overhead Press', 4, '6-8'),
  createExercise('Dumbbell Shoulder Press', 3, '8-10'),
  createExercise('Lateral Raises', 4, '12-15'),
  createExercise('Rear Delt Flyes', 3, '12-15'),
  createExercise('Face Pulls', 3, '15-20'),
  createExercise('Shrugs', 3, '12-15'),
  createExercise('Front Raises', 2, '12-15'),
];

const armExercises: TemplateExercise[] = [
  createExercise('Barbell Curls', 4, '8-10'),
  createExercise('Close Grip Bench Press', 4, '8-10'),
  createExercise('Hammer Curls', 3, '10-12'),
  createExercise('Skull Crushers', 3, '10-12'),
  createExercise('Preacher Curls', 3, '10-12'),
  createExercise('Tricep Pushdowns', 3, '12-15'),
  createExercise('Concentration Curls', 2, '12-15'),
  createExercise('Overhead Tricep Extension', 2, '12-15'),
];

const broLegsExercises: TemplateExercise[] = [
  createExercise('Squats', 5, '5-8'),
  createExercise('Leg Press', 4, '10-12'),
  createExercise('Romanian Deadlift', 4, '8-10'),
  createExercise('Walking Lunges', 3, '12', 'Per leg'),
  createExercise('Leg Extensions', 3, '12-15'),
  createExercise('Leg Curls', 3, '12-15'),
  createExercise('Calf Raises', 5, '15-20'),
];

// ===== FULL BODY =====
const fullBodyAExercises: TemplateExercise[] = [
  createExercise('Squats', 4, '6-8'),
  createExercise('Bench Press', 4, '6-8'),
  createExercise('Barbell Rows', 4, '6-8'),
  createExercise('Overhead Press', 3, '8-10'),
  createExercise('Romanian Deadlift', 3, '8-10'),
  createExercise('Pull-ups', 3, '8-10'),
  createExercise('Plank', 3, '60s'),
];

const fullBodyBExercises: TemplateExercise[] = [
  createExercise('Deadlift', 4, '5-6'),
  createExercise('Incline Dumbbell Press', 4, '8-10'),
  createExercise('Lat Pulldown', 4, '8-10'),
  createExercise('Dumbbell Lunges', 3, '10-12', 'Per leg'),
  createExercise('Dumbbell Shoulder Press', 3, '10-12'),
  createExercise('Cable Rows', 3, '10-12'),
  createExercise('Ab Wheel Rollouts', 3, '12-15'),
];

// ===== PREBUILT PLAN TEMPLATES =====
export const prebuiltPlanTemplates: PrebuiltPlanTemplate[] = [
  // PPL - 6 days
  {
    id: 'ppl-6day',
    name: 'Push Pull Legs (6 Day)',
    description: 'Classic 6-day split targeting each muscle group twice per week. Great for intermediate to advanced lifters.',
    type: 'ppl',
    daysPerWeek: 6,
    level: 'intermediate',
    goal: 'hypertrophy',
    days: [
      { dayIndex: 0, name: 'Push A', isRestDay: false, exercises: pplPushExercises },
      { dayIndex: 1, name: 'Pull A', isRestDay: false, exercises: pplPullExercises },
      { dayIndex: 2, name: 'Legs A', isRestDay: false, exercises: pplLegsExercises },
      { dayIndex: 3, name: 'Push B', isRestDay: false, exercises: pplPushExercises },
      { dayIndex: 4, name: 'Pull B', isRestDay: false, exercises: pplPullExercises },
      { dayIndex: 5, name: 'Legs B', isRestDay: false, exercises: pplLegsExercises },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },
  
  // PPL - 3 days (beginner)
  {
    id: 'ppl-3day',
    name: 'Push Pull Legs (3 Day)',
    description: 'Beginner-friendly PPL hitting each muscle group once per week.',
    type: 'ppl',
    daysPerWeek: 3,
    level: 'beginner',
    goal: 'general',
    days: [
      { dayIndex: 0, name: 'Push', isRestDay: false, exercises: pplPushExercises },
      { dayIndex: 1, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 2, name: 'Pull', isRestDay: false, exercises: pplPullExercises },
      { dayIndex: 3, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 4, name: 'Legs', isRestDay: false, exercises: pplLegsExercises },
      { dayIndex: 5, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },

  // Upper/Lower - 4 days
  {
    id: 'upper-lower-4day',
    name: 'Upper Lower Split (4 Day)',
    description: 'Balanced 4-day split alternating upper and lower body. Great for strength and hypertrophy.',
    type: 'upper_lower',
    daysPerWeek: 4,
    level: 'intermediate',
    goal: 'strength',
    days: [
      { dayIndex: 0, name: 'Upper A', isRestDay: false, exercises: upperExercises },
      { dayIndex: 1, name: 'Lower A', isRestDay: false, exercises: lowerExercises },
      { dayIndex: 2, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 3, name: 'Upper B', isRestDay: false, exercises: upperExercises },
      { dayIndex: 4, name: 'Lower B', isRestDay: false, exercises: lowerExercises },
      { dayIndex: 5, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },

  // Bro Split - 5 days
  {
    id: 'bro-split-5day',
    name: 'Bro Split (5 Day)',
    description: 'Traditional bodybuilding split targeting one muscle group per day. Great for muscle isolation.',
    type: 'bro_split',
    daysPerWeek: 5,
    level: 'intermediate',
    goal: 'hypertrophy',
    days: [
      { dayIndex: 0, name: 'Chest', isRestDay: false, exercises: chestExercises },
      { dayIndex: 1, name: 'Back', isRestDay: false, exercises: backExercises },
      { dayIndex: 2, name: 'Shoulders', isRestDay: false, exercises: shoulderExercises },
      { dayIndex: 3, name: 'Arms', isRestDay: false, exercises: armExercises },
      { dayIndex: 4, name: 'Legs', isRestDay: false, exercises: broLegsExercises },
      { dayIndex: 5, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },

  // Full Body - 3 days
  {
    id: 'full-body-3day',
    name: 'Full Body (3 Day)',
    description: 'Full body workout 3 times per week. Ideal for beginners or those with limited time.',
    type: 'full_body',
    daysPerWeek: 3,
    level: 'beginner',
    goal: 'general',
    days: [
      { dayIndex: 0, name: 'Full Body A', isRestDay: false, exercises: fullBodyAExercises },
      { dayIndex: 1, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 2, name: 'Full Body B', isRestDay: false, exercises: fullBodyBExercises },
      { dayIndex: 3, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 4, name: 'Full Body A', isRestDay: false, exercises: fullBodyAExercises },
      { dayIndex: 5, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },

  // Push/Pull - 4 days
  {
    id: 'push-pull-4day',
    name: 'Push Pull (4 Day)',
    description: 'Simple push/pull split. Legs are trained on both days. Good for beginners.',
    type: 'push_pull',
    daysPerWeek: 4,
    level: 'beginner',
    goal: 'strength',
    days: [
      { dayIndex: 0, name: 'Push + Quads', isRestDay: false, exercises: [...pplPushExercises.slice(0, 5), createExercise('Squats', 4, '6-8'), createExercise('Leg Extensions', 3, '12-15')] },
      { dayIndex: 1, name: 'Pull + Hams', isRestDay: false, exercises: [...pplPullExercises.slice(0, 5), createExercise('Romanian Deadlift', 4, '8-10'), createExercise('Leg Curls', 3, '12-15')] },
      { dayIndex: 2, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 3, name: 'Push + Quads', isRestDay: false, exercises: [...pplPushExercises.slice(0, 5), createExercise('Leg Press', 4, '10-12'), createExercise('Walking Lunges', 3, '12')] },
      { dayIndex: 4, name: 'Pull + Hams', isRestDay: false, exercises: [...pplPullExercises.slice(0, 5), createExercise('Hip Thrusts', 3, '10-12'), createExercise('Calf Raises', 4, '15-20')] },
      { dayIndex: 5, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },

  // Strength 5x5
  {
    id: 'strength-5x5',
    name: 'Strength 5x5',
    description: 'Classic 5x5 program focusing on compound lifts. Excellent for building raw strength.',
    type: 'full_body',
    daysPerWeek: 3,
    level: 'beginner',
    goal: 'strength',
    days: [
      { dayIndex: 0, name: 'Workout A', isRestDay: false, exercises: [
        createExercise('Squats', 5, 5, 'Add 5lbs each session'),
        createExercise('Bench Press', 5, 5, 'Add 5lbs each session'),
        createExercise('Barbell Rows', 5, 5, 'Add 5lbs each session'),
      ]},
      { dayIndex: 1, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 2, name: 'Workout B', isRestDay: false, exercises: [
        createExercise('Squats', 5, 5, 'Add 5lbs each session'),
        createExercise('Overhead Press', 5, 5, 'Add 5lbs each session'),
        createExercise('Deadlift', 1, 5, 'Add 10lbs each session'),
      ]},
      { dayIndex: 3, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 4, name: 'Workout A', isRestDay: false, exercises: [
        createExercise('Squats', 5, 5, 'Add 5lbs each session'),
        createExercise('Bench Press', 5, 5, 'Add 5lbs each session'),
        createExercise('Barbell Rows', 5, 5, 'Add 5lbs each session'),
      ]},
      { dayIndex: 5, name: 'Rest', isRestDay: true, exercises: [] },
      { dayIndex: 6, name: 'Rest', isRestDay: true, exercises: [] },
    ],
  },
];

// Get plan templates by type
export const getPlansByType = (type: string) => 
  prebuiltPlanTemplates.filter(p => p.type === type);

// Get plan templates by goal
export const getPlansByGoal = (goal: string) => 
  prebuiltPlanTemplates.filter(p => p.goal === goal);

// Get plan templates by level
export const getPlansByLevel = (level: string) => 
  prebuiltPlanTemplates.filter(p => p.level === level);

export default prebuiltPlanTemplates;
