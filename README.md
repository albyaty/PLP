# PLP Gym Log

Phone-first workout tracker for the PLP arm specialization program.

Current regimen: PLP Arm Specialization v2. Weekly shape: Push > Abs & Legs > Pull A > Rest > Push > Abs & Legs > Pull B > Rest.

The GitHub Pages site is just the app shell. Your workout state is stored in
Supabase behind your login, so clearing Safari data or switching browsers does
not erase the real copy. Browser storage is only used as a cache and offline
draft.

When the same account is open on two devices, the app checks the cloud copy
before saving and merges newer workout entries instead of blindly replacing the
whole log. Conflict snapshots are kept locally as a last-resort safety copy.
The last 5 cloud states before successful writes are also kept as restore
points in Supabase, with redo available after a restore.

## Features

- 8-slot PLP cycle with rest slots.
- Updated v2 arm-specialization split with Push and Pull separated by Abs & Legs.
- Repeated Push and Abs & Legs slots share the same exercise plan and in-progress entries.
- Per-set weight, reps, and done tracking.
- Sticky notes per exercise.
- Last workout display per exercise.
- Editable day plans: reorder exercises, add an existing exercise, or create a new one.
- Conflict-safe cloud sync for stale phone/laptop sessions.
- Restore previous sync and redo restore from Settings.
- "Add load next time" cue when all sets hit the top of the rep range.
- Export/import JSON backup.
- Installable on iPhone from Share > Add to Home Screen.

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. In Authentication > Users, create your own user with email and password.
4. Keep public signups disabled for this personal app.
5. In Supabase, go to Project Settings > API.
6. Copy the Project URL and the anon or publishable key.
7. Paste them into `config.js`.

Keep the service role key private. Never put it in `config.js`, GitHub, or
browser code.

## GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, open Settings > Pages.
3. Set Source to Deploy from a branch.
4. Select the `main` branch and `/ (root)` folder.
5. Save. GitHub deploys the static site from the checked-in files.

GitHub Pages sites are publicly reachable by default. That is okay for this
setup because the public site does not contain your workout log. Supabase Row
Level Security restricts the database row to your signed-in user.
