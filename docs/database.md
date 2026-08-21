# Database design

## Relationship overview

```text
User ──< GymStaff >── Gym
User ──< GymMembership >── Gym
TrainerProfile ──< GymTrainer >── Gym
User ──< TrainerClient >── TrainerProfile
Gym ──< SubscriptionPlan ──< Subscription >── User
TrainerProfile ──< WorkoutPlan ──< WorkoutDay ──< WorkoutExercise
WorkoutPlan ──< WorkoutAssignment >── User
TrainerProfile ──< DietPlan ──< DietDay ──< Meal ──< FoodItem
DietPlan ──< DietAssignment >── User
TrainerProfile ──< TrainerAvailability
TrainerProfile ──< TrainingSession >── TrainerClient
WorkoutAssignment ──< WorkoutLog ──< ExerciseLog
DietAssignment ──< NutritionLog ──< MealLog
User ──< BodyMeasurement ──< ProgressPhoto
User ──< Notification
User ──< Payment >── Subscription
Payment ──< PaymentEvent
User ──< AuditLog >── Gym
User ──< GymReview >── Gym
User ──< TrainerReview >── TrainerProfile
```

`Feedback` belongs to an author and recipient and can optionally be attached to a trainer-client relationship, workout assignment, or diet assignment.

## Lifecycle rules

- Users are `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`. Only active users may authenticate.
- Gym membership and trainer applications start as `PENDING`; gym staff can move them to `ACTIVE` or `REJECTED`, and active relationships may later be suspended, expired, or cancelled.
- Trainer-client relationships have their own lifecycle because a client may use a trainer independently of gym membership.
- Subscription state is independent from membership state so payment and access expiration can be reconciled safely.
- Workout and nutrition plan families contain immutable published versions. Assignments always point to a specific version, so later edits cannot alter a student's historical prescription.
- Gyms and plans are archived instead of being deleted when historical subscriptions or assignments reference them.

## Data integrity

The migration adds SQLite constraints in addition to Prisma validation:

- user roles, statuses, membership states, and plan states are restricted to known enum values;
- review scores must be between 1 and 5;
- monetary values cannot be negative;
- subscription end dates must follow start dates;
- latitude and longitude must be in valid ranges;
- duplicate gym memberships, trainer memberships, client relationships, and reviews are prevented with compound unique indexes;
- weekly availability is limited to valid weekdays and minute ranges;
- training sessions must end after they start and use a known lifecycle status;
- workout effort, exercise RPE, hunger, and energy ratings are restricted to 1–10;
- body weight, body-fat percentage, and circumference measurements reject impossible values;
- daily nutrition logs and child execution records use compound uniqueness constraints;
- payment idempotency keys, provider references, and webhook event IDs are unique;
- review scores remain restricted to 1–5 and verification is derived from service history;
- foreign keys define explicit cascade, restrict, or set-null behavior.

Authorization rules that depend on business context remain application responsibilities. Examples include ensuring an `ADMIN` assigned to `GymStaff` is the reviewer of an application, ensuring a subscription plan belongs to the subscription's gym, and ensuring only completed service relationships can submit reviews.

## Migration compatibility

`20260821020000_domain_foundation` preserves existing users and passwords. It also migrates legacy gym memberships, subscriptions, plans, feedback, and ratings when present. Legacy serialized workout and diet data is retained in `legacyExercises` and `legacyMeals` until the structured plan migration in Step 5.

Local database files are not versioned. Recreate a database with migrations and optionally run the idempotent seed:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```
