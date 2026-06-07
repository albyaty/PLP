# PLP Gym Log

Phone-first workout tracker for the PLP arm specialization program.

The GitHub Pages site is just the app shell. Your workout state is stored in
Supabase behind your login, so clearing Safari data or switching browsers does
not erase the real copy. Browser storage is only used as a cache and offline
draft.

## Features

- 8-slot PLP cycle with rest slots.
- Per-set weight, reps, and done tracking.
- Sticky notes per exercise.
- Last workout display per exercise.
- Load last weights without copying old reps.
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
3. Set Source to GitHub Actions.
4. Push to `main` or `master`; the workflow deploys the static site.

GitHub Pages sites are publicly reachable by default. That is okay for this
setup because the public site does not contain your workout log. Supabase Row
Level Security restricts the database row to your signed-in user.
