// GymTracker Exercise Database
// Equipment keys: "none" (bodyweight), "dumbbells", "barbell", "cables",
//                 "machine", "kettlebell", "resistance_bands", "pullup_bar", "bench"
// An exercise requires ALL equipment in its array to be available.
// Empty array = bodyweight only (always available).

const EXERCISES = [

  // ── CHEST ─────────────────────────────────────────────────────────────────
  {
    id: "push_up",
    name: "Push-Up",
    muscle: "Chest",
    secondary: ["Triceps", "Shoulders"],
    equipment: [],
    category: "Chest",
    instructions: "Start in plank with hands shoulder-width apart. Lower chest to floor then press back up. Keep core tight."
  },
  {
    id: "wide_push_up",
    name: "Wide Push-Up",
    muscle: "Chest",
    secondary: ["Triceps"],
    equipment: [],
    category: "Chest",
    instructions: "Like a push-up but hands are wider than shoulders. Targets the outer chest more."
  },
  {
    id: "incline_push_up",
    name: "Incline Push-Up",
    muscle: "Chest",
    secondary: ["Triceps", "Shoulders"],
    equipment: ["bench"],
    category: "Chest",
    instructions: "Place hands on bench edge, feet on floor. Press up. Easier than standard push-ups — good for warmup."
  },
  {
    id: "chest_dip",
    name: "Chest Dip",
    muscle: "Chest",
    secondary: ["Triceps", "Shoulders"],
    equipment: [],
    category: "Chest",
    instructions: "Use parallel bars or a sturdy chair. Lean slightly forward to target chest. Lower until arms are 90°, press back up."
  },
  {
    id: "bench_press_bb",
    name: "Barbell Bench Press",
    muscle: "Chest",
    secondary: ["Triceps", "Shoulders"],
    equipment: ["barbell", "bench"],
    category: "Chest",
    instructions: "Lie on bench. Lower bar to mid-chest with elbows at ~75°, then press up explosively. The king of chest exercises."
  },
  {
    id: "incline_bench_press_bb",
    name: "Incline Barbell Bench Press",
    muscle: "Chest",
    secondary: ["Shoulders", "Triceps"],
    equipment: ["barbell", "bench"],
    category: "Chest",
    instructions: "Set bench to 30–45°. Lower bar to upper chest, press up. Hits the upper chest."
  },
  {
    id: "bench_press_db",
    name: "Dumbbell Bench Press",
    muscle: "Chest",
    secondary: ["Triceps", "Shoulders"],
    equipment: ["dumbbells", "bench"],
    category: "Chest",
    instructions: "Lie on bench with dumbbells at chest level. Press up and slightly inward. Greater range of motion than barbell."
  },
  {
    id: "incline_press_db",
    name: "Incline Dumbbell Press",
    muscle: "Chest",
    secondary: ["Shoulders", "Triceps"],
    equipment: ["dumbbells", "bench"],
    category: "Chest",
    instructions: "Set bench to 30–45°. Press dumbbells up from upper chest level, squeezing at top."
  },
  {
    id: "fly_db",
    name: "Dumbbell Fly",
    muscle: "Chest",
    secondary: [],
    equipment: ["dumbbells", "bench"],
    category: "Chest",
    instructions: "Lie on bench, arms extended above chest. Lower dumbbells in an arc to sides then bring back together. Slight bend in elbows."
  },
  {
    id: "cable_fly",
    name: "Cable Fly",
    muscle: "Chest",
    secondary: [],
    equipment: ["cables"],
    category: "Chest",
    instructions: "Set cables at chest height. Stand in split stance, bring handles together in front of chest in an arc. Squeeze at the top."
  },
  {
    id: "cable_crossover",
    name: "Cable Crossover",
    muscle: "Chest",
    secondary: [],
    equipment: ["cables"],
    category: "Chest",
    instructions: "Set cables high. Pull handles down and across body, crossing them at the bottom. Great for lower chest definition."
  },
  {
    id: "chest_press_machine",
    name: "Chest Press Machine",
    muscle: "Chest",
    secondary: ["Triceps", "Shoulders"],
    equipment: ["machine"],
    category: "Chest",
    instructions: "Sit in machine, adjust seat so handles are at chest height. Press forward until arms are extended. Control the return."
  },

  // ── BACK ──────────────────────────────────────────────────────────────────
  {
    id: "pull_up",
    name: "Pull-Up",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["pullup_bar"],
    category: "Back",
    instructions: "Hang with overhand grip (palms away), hands shoulder-width or wider. Pull until chin clears the bar. Full hang to start each rep."
  },
  {
    id: "chin_up",
    name: "Chin-Up",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["pullup_bar"],
    category: "Back",
    instructions: "Hang with underhand grip (palms toward you). Pull until chin clears the bar. Easier than pull-ups and hits biceps harder."
  },
  {
    id: "inverted_row",
    name: "Inverted Row",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["pullup_bar"],
    category: "Back",
    instructions: "Set bar at waist height. Lie underneath, grip bar, body straight. Pull chest to bar. Good beginner pulling exercise."
  },
  {
    id: "hanging_leg_raise",
    name: "Hanging Leg Raise",
    muscle: "Core",
    secondary: ["Hip Flexors"],
    equipment: ["pullup_bar"],
    category: "Core",
    instructions: "Hang from bar. Keep legs straight and raise them to horizontal or higher. Lower slowly without swinging."
  },
  {
    id: "deadlift",
    name: "Deadlift",
    muscle: "Back",
    secondary: ["Glutes", "Hamstrings", "Traps"],
    equipment: ["barbell"],
    category: "Back",
    instructions: "Stand with mid-foot under bar. Hinge at hips to grip it. Drive through heels to stand, keeping back flat. The ultimate compound lift."
  },
  {
    id: "barbell_row",
    name: "Barbell Row",
    muscle: "Back",
    secondary: ["Biceps", "Rear Deltoids"],
    equipment: ["barbell"],
    category: "Back",
    instructions: "Hinge forward ~45°, grip bar overhand. Pull bar to lower chest/upper abs, squeezing shoulder blades. Lower slowly."
  },
  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    muscle: "Hamstrings",
    secondary: ["Glutes", "Lower Back"],
    equipment: ["barbell"],
    category: "Legs",
    instructions: "Hold bar at hips. Hinge forward lowering bar along legs until strong hamstring stretch. Drive hips forward to return. Keep slight knee bend."
  },
  {
    id: "dumbbell_row",
    name: "Dumbbell Row",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["dumbbells", "bench"],
    category: "Back",
    instructions: "Place one knee and hand on bench for support. Pull dumbbell from hanging to hip, elbow driving back. Keep torso flat. Switch sides."
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["cables"],
    category: "Back",
    instructions: "Grip bar wider than shoulders, overhand. Pull bar down to upper chest, leaning back slightly. Slowly return to full arm extension."
  },
  {
    id: "cable_row",
    name: "Seated Cable Row",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["cables"],
    category: "Back",
    instructions: "Sit at cable row, feet on platform. Pull handle to abdomen, squeezing shoulder blades together. Sit tall, don't rock."
  },
  {
    id: "face_pull",
    name: "Face Pull",
    muscle: "Rear Deltoids",
    secondary: ["Traps", "Rotator Cuff"],
    equipment: ["cables"],
    category: "Shoulders",
    instructions: "Set cable at face height with rope. Pull rope to face with elbows flared wide. Great for shoulder health and rear delts."
  },
  {
    id: "t_bar_row",
    name: "T-Bar Row",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["barbell"],
    category: "Back",
    instructions: "Wedge one end of barbell in a corner. Straddle the bar, grip the loaded end, and row it up to chest. Great for thickness."
  },
  {
    id: "back_extension",
    name: "Back Extension",
    muscle: "Lower Back",
    secondary: ["Glutes", "Hamstrings"],
    equipment: ["machine"],
    category: "Back",
    instructions: "Lock feet in the machine. Hinge at hips to lower torso, then raise back to horizontal. Don't hyperextend at the top."
  },
  {
    id: "band_row",
    name: "Resistance Band Row",
    muscle: "Back",
    secondary: ["Biceps"],
    equipment: ["resistance_bands"],
    category: "Back",
    instructions: "Anchor band at chest height. Hold ends and step back for tension. Pull handles to sides of chest, squeezing shoulder blades."
  },

  // ── SHOULDERS ─────────────────────────────────────────────────────────────
  {
    id: "overhead_press_bb",
    name: "Overhead Press (Barbell)",
    muscle: "Shoulders",
    secondary: ["Triceps", "Upper Chest"],
    equipment: ["barbell"],
    category: "Shoulders",
    instructions: "Stand with bar at shoulder height. Brace core and press straight overhead. Lock out at top, lower slowly to start position."
  },
  {
    id: "shoulder_press_db",
    name: "Dumbbell Shoulder Press",
    muscle: "Shoulders",
    secondary: ["Triceps"],
    equipment: ["dumbbells"],
    category: "Shoulders",
    instructions: "Sit or stand with dumbbells at shoulder height, palms forward. Press up until arms are extended. Lower back to shoulders."
  },
  {
    id: "lateral_raise",
    name: "Lateral Raise",
    muscle: "Shoulders",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Shoulders",
    instructions: "Stand with dumbbells at sides. Raise arms out to sides to shoulder height — lead with elbows, not wrists. Lower slowly."
  },
  {
    id: "front_raise",
    name: "Front Raise",
    muscle: "Shoulders",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Shoulders",
    instructions: "Hold dumbbells in front of thighs. Raise straight arms forward to shoulder height. Alternate or both together."
  },
  {
    id: "rear_delt_fly",
    name: "Rear Delt Fly",
    muscle: "Rear Deltoids",
    secondary: ["Upper Back"],
    equipment: ["dumbbells"],
    category: "Shoulders",
    instructions: "Hinge forward at hips, dumbbells hanging. Raise arms out to sides keeping a slight bend in elbows, squeezing rear delts."
  },
  {
    id: "arnold_press",
    name: "Arnold Press",
    muscle: "Shoulders",
    secondary: ["Triceps"],
    equipment: ["dumbbells"],
    category: "Shoulders",
    instructions: "Start with palms facing you at shoulder height. As you press up, rotate palms to face forward. Reverse on the way down."
  },
  {
    id: "cable_lateral_raise",
    name: "Cable Lateral Raise",
    muscle: "Shoulders",
    secondary: [],
    equipment: ["cables"],
    category: "Shoulders",
    instructions: "Stand beside low cable pulley. Pull handle up and out to side to shoulder height. Keep constant tension vs dumbbells."
  },
  {
    id: "upright_row",
    name: "Upright Row",
    muscle: "Shoulders",
    secondary: ["Traps", "Biceps"],
    equipment: ["barbell"],
    category: "Shoulders",
    instructions: "Grip bar with hands 10-12 inches apart. Pull up to chin with elbows flaring higher than the bar."
  },
  {
    id: "shoulder_press_machine",
    name: "Shoulder Press Machine",
    muscle: "Shoulders",
    secondary: ["Triceps"],
    equipment: ["machine"],
    category: "Shoulders",
    instructions: "Sit and adjust seat so handles are at shoulder height. Press handles up overhead and lower under control."
  },
  {
    id: "shrug_db",
    name: "Dumbbell Shrug",
    muscle: "Traps",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Shoulders",
    instructions: "Hold dumbbells at sides. Shrug shoulders straight up toward ears, hold 1 second, lower slowly. Don't roll the shoulders."
  },
  {
    id: "shrug_bb",
    name: "Barbell Shrug",
    muscle: "Traps",
    secondary: [],
    equipment: ["barbell"],
    category: "Shoulders",
    instructions: "Hold barbell in front with overhand grip. Shrug straight up, hold briefly, lower. Heavy weight is fine here."
  },
  {
    id: "band_pull_apart",
    name: "Band Pull-Apart",
    muscle: "Rear Deltoids",
    secondary: ["Traps", "Rotator Cuff"],
    equipment: ["resistance_bands"],
    category: "Shoulders",
    instructions: "Hold band at arm's length, shoulder width. Pull hands apart, keeping arms straight. Squeeze shoulder blades at full stretch."
  },

  // ── BICEPS ────────────────────────────────────────────────────────────────
  {
    id: "barbell_curl",
    name: "Barbell Curl",
    muscle: "Biceps",
    secondary: ["Forearms"],
    equipment: ["barbell"],
    category: "Biceps",
    instructions: "Stand holding bar with underhand grip. Keep elbows pinned to sides. Curl bar to shoulders. Lower slowly — don't swing."
  },
  {
    id: "dumbbell_curl",
    name: "Dumbbell Curl",
    muscle: "Biceps",
    secondary: ["Forearms"],
    equipment: ["dumbbells"],
    category: "Biceps",
    instructions: "Stand with dumbbells. Curl one or both up, rotating wrist (supination) at the top. Keep upper arms still."
  },
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    muscle: "Biceps",
    secondary: ["Forearms", "Brachialis"],
    equipment: ["dumbbells"],
    category: "Biceps",
    instructions: "Hold dumbbells with neutral grip (thumbs up). Curl up without rotating the wrist. Targets the brachialis and outer bicep."
  },
  {
    id: "incline_curl",
    name: "Incline Dumbbell Curl",
    muscle: "Biceps",
    secondary: [],
    equipment: ["dumbbells", "bench"],
    category: "Biceps",
    instructions: "Sit on inclined bench, arms hanging straight down behind you. Curl up from that stretched position. Great peak contraction."
  },
  {
    id: "cable_curl",
    name: "Cable Curl",
    muscle: "Biceps",
    secondary: ["Forearms"],
    equipment: ["cables"],
    category: "Biceps",
    instructions: "Stand at cable with low pulley, straight bar or EZ-bar. Curl handle up to shoulders keeping constant tension."
  },
  {
    id: "concentration_curl",
    name: "Concentration Curl",
    muscle: "Biceps",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Biceps",
    instructions: "Sit on bench, brace upper arm against inner thigh. Curl dumbbell up slowly. Maximum peak contraction isolation."
  },
  {
    id: "preacher_curl",
    name: "Preacher Curl Machine",
    muscle: "Biceps",
    secondary: [],
    equipment: ["machine"],
    category: "Biceps",
    instructions: "Brace upper arms on preacher pad. Lower until arms nearly straight (don't hyperextend), curl back up fully."
  },
  {
    id: "band_bicep_curl",
    name: "Band Bicep Curl",
    muscle: "Biceps",
    secondary: [],
    equipment: ["resistance_bands"],
    category: "Biceps",
    instructions: "Stand on the middle of the band, hold the ends. Curl up as you would with dumbbells. Good pump at home or hotel."
  },

  // ── TRICEPS ───────────────────────────────────────────────────────────────
  {
    id: "diamond_push_up",
    name: "Diamond Push-Up",
    muscle: "Triceps",
    secondary: ["Chest"],
    equipment: [],
    category: "Triceps",
    instructions: "Place hands close together with index fingers and thumbs forming a diamond shape. Push up from this position. Very tricep-focused."
  },
  {
    id: "tricep_dip",
    name: "Tricep Dip",
    muscle: "Triceps",
    secondary: ["Chest", "Shoulders"],
    equipment: [],
    category: "Triceps",
    instructions: "Hands on chair or parallel bars, body upright (not leaning forward). Lower until arms are 90°, press back up. Keep elbows close."
  },
  {
    id: "close_grip_bench",
    name: "Close-Grip Bench Press",
    muscle: "Triceps",
    secondary: ["Chest"],
    equipment: ["barbell", "bench"],
    category: "Triceps",
    instructions: "Grip bar with hands 10-12 inches apart. Lower to lower chest, press up keeping elbows close to body. Tricep-focused bench variation."
  },
  {
    id: "tricep_pushdown",
    name: "Tricep Pushdown",
    muscle: "Triceps",
    secondary: [],
    equipment: ["cables"],
    category: "Triceps",
    instructions: "Stand at cable with rope or straight bar attachment. Push down until arms fully extended. Squeeze at bottom, slowly return."
  },
  {
    id: "overhead_tricep_ext_db",
    name: "Overhead Tricep Extension",
    muscle: "Triceps",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Triceps",
    instructions: "Hold one dumbbell overhead with both hands (or one in each hand). Lower behind head by bending elbows, extend back up."
  },
  {
    id: "skull_crusher",
    name: "Skull Crusher",
    muscle: "Triceps",
    secondary: [],
    equipment: ["barbell", "bench"],
    category: "Triceps",
    instructions: "Lie on bench with bar over chest, arms extended. Bend elbows to lower bar toward forehead. Extend back up. EZ-bar is easier on wrists."
  },
  {
    id: "tricep_kickback",
    name: "Tricep Kickback",
    muscle: "Triceps",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Triceps",
    instructions: "Hinge forward, upper arm parallel to floor, elbow at 90°. Extend forearm back until arm is fully straight. Squeeze at top."
  },
  {
    id: "band_tricep_pushdown",
    name: "Band Tricep Pushdown",
    muscle: "Triceps",
    secondary: [],
    equipment: ["resistance_bands"],
    category: "Triceps",
    instructions: "Anchor band above head. Hold ends and push down until arms are extended, then slowly return. Good at-home tricep work."
  },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  {
    id: "bodyweight_squat",
    name: "Bodyweight Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Hamstrings"],
    equipment: [],
    category: "Legs",
    instructions: "Feet shoulder-width, toes slightly out. Push hips back and bend knees to lower down. Drive through heels to stand. Keep chest up."
  },
  {
    id: "jump_squat",
    name: "Jump Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Calves"],
    equipment: [],
    category: "Legs",
    instructions: "Squat down then explode upward off the floor. Land softly with bent knees. Builds power and burns calories."
  },
  {
    id: "lunge",
    name: "Bodyweight Lunge",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Hamstrings"],
    equipment: [],
    category: "Legs",
    instructions: "Step forward with one leg and lower your back knee toward the floor. Keep front shin vertical. Push off front foot to return."
  },
  {
    id: "glute_bridge",
    name: "Glute Bridge",
    muscle: "Glutes",
    secondary: ["Hamstrings"],
    equipment: [],
    category: "Legs",
    instructions: "Lie on back, knees bent, feet flat. Drive hips up squeezing glutes hard at the top. Lower slowly. Can use a barbell for resistance."
  },
  {
    id: "calf_raise",
    name: "Calf Raise",
    muscle: "Calves",
    secondary: [],
    equipment: [],
    category: "Legs",
    instructions: "Stand on edge of step or flat floor. Rise up on toes as high as possible, hold 1 second, lower. Use a wall for balance if needed."
  },
  {
    id: "barbell_squat",
    name: "Barbell Back Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Hamstrings", "Core"],
    equipment: ["barbell"],
    category: "Legs",
    instructions: "Bar rested on upper back (not neck). Feet shoulder-width, toes out. Squat until thighs are parallel, drive through heels to stand."
  },
  {
    id: "front_squat",
    name: "Front Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Core"],
    equipment: ["barbell"],
    category: "Legs",
    instructions: "Bar resting on front deltoids, elbows high. Squat while keeping torso very upright. More quad-focused than back squat."
  },
  {
    id: "sumo_deadlift",
    name: "Sumo Deadlift",
    muscle: "Glutes",
    secondary: ["Hamstrings", "Quadriceps", "Back"],
    equipment: ["barbell"],
    category: "Legs",
    instructions: "Wide stance, toes pointed out. Grip bar between legs. Pull straight up keeping back flat. Great for glutes and inner thighs."
  },
  {
    id: "hip_thrust_bb",
    name: "Hip Thrust (Barbell)",
    muscle: "Glutes",
    secondary: ["Hamstrings"],
    equipment: ["barbell", "bench"],
    category: "Legs",
    instructions: "Upper back on bench edge, bar across hips (use a pad). Drive hips up until body is in a straight line. Squeeze glutes hard at top."
  },
  {
    id: "goblet_squat",
    name: "Goblet Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Core"],
    equipment: ["dumbbells"],
    category: "Legs",
    instructions: "Hold one dumbbell vertically at chest. Squat deep keeping chest up and elbows inside knees at the bottom."
  },
  {
    id: "dumbbell_lunge",
    name: "Dumbbell Lunge",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Hamstrings"],
    equipment: ["dumbbells"],
    category: "Legs",
    instructions: "Hold dumbbells at sides. Step forward into lunge, lower back knee toward floor, return. Alternate legs or do one side at a time."
  },
  {
    id: "romanian_deadlift_db",
    name: "Dumbbell Romanian Deadlift",
    muscle: "Hamstrings",
    secondary: ["Glutes", "Lower Back"],
    equipment: ["dumbbells"],
    category: "Legs",
    instructions: "Hold dumbbells in front of thighs. Hinge at hips, lowering dumbbells along legs until you feel a hamstring stretch. Return."
  },
  {
    id: "bulgarian_split_squat",
    name: "Bulgarian Split Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes"],
    equipment: ["bench"],
    category: "Legs",
    instructions: "Rear foot elevated on bench. Lower front leg to a lunge position. One of the hardest and most effective leg exercises."
  },
  {
    id: "leg_press",
    name: "Leg Press",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Hamstrings"],
    equipment: ["machine"],
    category: "Legs",
    instructions: "Sit in machine with feet on platform hip-width. Push platform away until legs nearly straight. Lower slowly — don't lock out knees."
  },
  {
    id: "leg_curl",
    name: "Leg Curl Machine",
    muscle: "Hamstrings",
    secondary: [],
    equipment: ["machine"],
    category: "Legs",
    instructions: "Lie (or sit) in machine with pad behind ankles. Curl legs toward glutes, hold briefly, lower slowly."
  },
  {
    id: "leg_extension",
    name: "Leg Extension Machine",
    muscle: "Quadriceps",
    secondary: [],
    equipment: ["machine"],
    category: "Legs",
    instructions: "Sit in machine with pad on front of ankles. Extend legs until straight, hold briefly, lower slowly."
  },
  {
    id: "db_calf_raise",
    name: "Dumbbell Calf Raise",
    muscle: "Calves",
    secondary: [],
    equipment: ["dumbbells"],
    category: "Legs",
    instructions: "Hold dumbbells for added resistance. Stand on edge of step or flat floor. Rise on toes, hold, lower slowly."
  },
  {
    id: "kb_swing",
    name: "Kettlebell Swing",
    muscle: "Glutes",
    secondary: ["Hamstrings", "Back", "Core"],
    equipment: ["kettlebell"],
    category: "Legs",
    instructions: "Hinge at hips, swing kettlebell between legs, then drive hips forward explosively to swing it to chest height. It's a hip hinge, not a squat."
  },
  {
    id: "goblet_squat_kb",
    name: "Kettlebell Goblet Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Core"],
    equipment: ["kettlebell"],
    category: "Legs",
    instructions: "Hold kettlebell at chest with both hands cupping the bell. Squat deep, keeping elbows inside knees at the bottom."
  },
  {
    id: "banded_squat",
    name: "Banded Squat",
    muscle: "Quadriceps",
    secondary: ["Glutes", "Hip Abductors"],
    equipment: ["resistance_bands"],
    category: "Legs",
    instructions: "Place band just above knees. Squat as normal but push knees outward against the band throughout the movement."
  },
  {
    id: "band_lateral_walk",
    name: "Band Lateral Walk",
    muscle: "Glutes",
    secondary: ["Hip Abductors"],
    equipment: ["resistance_bands"],
    category: "Legs",
    instructions: "Place band around ankles. Get into a slight squat. Step sideways maintaining tension in the band. Do both directions."
  },

  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: "plank",
    name: "Plank",
    muscle: "Core",
    secondary: ["Shoulders"],
    equipment: [],
    category: "Core",
    instructions: "Forearms on floor, body straight from head to heels. Don't let hips sag or pike up. Breathe steadily. Hold for time."
  },
  {
    id: "side_plank",
    name: "Side Plank",
    muscle: "Core",
    secondary: ["Shoulders"],
    equipment: [],
    category: "Core",
    instructions: "Support body on one forearm and side of foot. Keep hips raised and body straight. Hold each side for equal time."
  },
  {
    id: "crunch",
    name: "Crunch",
    muscle: "Core",
    secondary: [],
    equipment: [],
    category: "Core",
    instructions: "Lie on back, knees bent. Curl only your shoulders off the floor toward your knees — don't pull on your neck. Lower slowly."
  },
  {
    id: "bicycle_crunch",
    name: "Bicycle Crunch",
    muscle: "Core",
    secondary: [],
    equipment: [],
    category: "Core",
    instructions: "Lie on back, hands lightly behind head. Bring one elbow to the opposite knee while extending the other leg. Alternate sides."
  },
  {
    id: "leg_raise",
    name: "Leg Raise",
    muscle: "Core",
    secondary: [],
    equipment: [],
    category: "Core",
    instructions: "Lie on back, legs straight. Raise legs to vertical without letting lower back arch, then lower slowly without touching the floor."
  },
  {
    id: "russian_twist",
    name: "Russian Twist",
    muscle: "Core",
    secondary: [],
    equipment: [],
    category: "Core",
    instructions: "Sit at 45° with feet raised. Rotate torso side to side touching the floor with your hands each rep. Hold a dumbbell to make it harder."
  },
  {
    id: "mountain_climber",
    name: "Mountain Climber",
    muscle: "Core",
    secondary: ["Shoulders", "Legs"],
    equipment: [],
    category: "Core",
    instructions: "Start in push-up position. Rapidly drive alternating knees to chest. Keep hips level. Excellent cardio + core combo."
  },
  {
    id: "ab_wheel",
    name: "Ab Wheel Rollout",
    muscle: "Core",
    secondary: ["Shoulders", "Back"],
    equipment: [],
    category: "Core",
    instructions: "Kneel, hold ab wheel in front of you. Roll forward extending body as far as possible, then pull back using your abs. Very hard."
  },
  {
    id: "v_up",
    name: "V-Up",
    muscle: "Core",
    secondary: [],
    equipment: [],
    category: "Core",
    instructions: "Lie flat, arms overhead. Simultaneously raise legs and torso to meet in the middle, reaching toward your toes. Lower slowly."
  },
  {
    id: "cable_crunch",
    name: "Cable Crunch",
    muscle: "Core",
    secondary: [],
    equipment: ["cables"],
    category: "Core",
    instructions: "Kneel at cable machine with rope attachment overhead. Pull rope down while crunching — hips stay still, only torso moves."
  },

  // ── CARDIO / FULL BODY ────────────────────────────────────────────────────
  {
    id: "burpee",
    name: "Burpee",
    muscle: "Full Body",
    secondary: [],
    equipment: [],
    category: "Cardio",
    instructions: "From standing: squat down, kick feet back to push-up, do a push-up (optional), jump feet to hands, then jump up with arms overhead."
  },
  {
    id: "jumping_jack",
    name: "Jumping Jack",
    muscle: "Full Body",
    secondary: [],
    equipment: [],
    category: "Cardio",
    instructions: "Jump feet apart while raising arms overhead, then jump back together. Classic cardio warmup. Do before heavy lifts."
  },
  {
    id: "treadmill_run",
    name: "Treadmill Run",
    muscle: "Cardiovascular",
    secondary: ["Legs", "Core"],
    equipment: ["cardio_machine"],
    category: "Cardio",
    type: "cardio",
    instructions: "Set your speed and incline. Start with a 2-3 min warmup walk. Log duration and distance when done."
  },
  {
    id: "outdoor_run",
    name: "Outdoor Run",
    muscle: "Cardiovascular",
    secondary: ["Legs", "Core"],
    equipment: [],
    category: "Cardio",
    type: "cardio",
    instructions: "Log your duration and distance. Track your pace over time to see improvement."
  },
  {
    id: "stationary_bike",
    name: "Stationary Bike",
    muscle: "Cardiovascular",
    secondary: ["Legs"],
    equipment: ["cardio_machine"],
    category: "Cardio",
    type: "cardio",
    instructions: "Set resistance level. Adjust seat so leg is nearly straight at bottom of pedal stroke. Good low-impact cardio."
  },
  {
    id: "rowing_machine",
    name: "Rowing Machine",
    muscle: "Cardiovascular",
    secondary: ["Back", "Arms", "Legs"],
    equipment: ["cardio_machine"],
    category: "Cardio",
    type: "cardio",
    instructions: "Drive with legs first, then lean back, then pull arms to chest. Reverse order on return. Excellent full-body cardio."
  },
  {
    id: "elliptical",
    name: "Elliptical",
    muscle: "Cardiovascular",
    secondary: ["Legs", "Core"],
    equipment: ["cardio_machine"],
    category: "Cardio",
    type: "cardio",
    instructions: "Set resistance and incline. Push and pull the handles to engage upper body. Low-impact and easy on joints."
  },
  {
    id: "stair_climber",
    name: "Stair Climber",
    muscle: "Cardiovascular",
    secondary: ["Glutes", "Legs"],
    equipment: ["cardio_machine"],
    category: "Cardio",
    type: "cardio",
    instructions: "Set a manageable pace. Don't lean too heavily on the rails — let your legs do the work. Great for glutes."
  },
  {
    id: "jump_rope",
    name: "Jump Rope",
    muscle: "Cardiovascular",
    secondary: ["Calves", "Shoulders"],
    equipment: [],
    category: "Cardio",
    type: "cardio",
    instructions: "Keep a steady rhythm with small wrist rotations. Try intervals: 30s on, 30s rest. Log total duration."
  },
  {
    id: "hiit",
    name: "HIIT Circuit",
    muscle: "Cardiovascular",
    secondary: ["Full Body"],
    equipment: [],
    category: "Cardio",
    type: "cardio",
    instructions: "Alternate 20-40 seconds of high intensity work with 10-20 seconds rest. Log total session duration and rounds completed."
  }

];

// Helper: get all equipment tags referenced in the database
const ALL_EQUIPMENT = [
  { id: "none",            label: "Bodyweight",       icon: "BW" },
  { id: "dumbbells",       label: "Dumbbells",         icon: "DB" },
  { id: "barbell",         label: "Barbell + Rack",    icon: "BB" },
  { id: "cables",          label: "Cable Machine",     icon: "CA" },
  { id: "machine",         label: "Weight Machines",   icon: "MC" },
  { id: "cardio_machine",  label: "Cardio Machines",   icon: "CV" },
  { id: "kettlebell",      label: "Kettlebell",        icon: "KB" },
  { id: "resistance_bands",label: "Resistance Bands",  icon: "RB" },
  { id: "pullup_bar",      label: "Pull-up Bar",       icon: "PB" },
  { id: "bench",           label: "Bench",             icon: "BN" },
];
