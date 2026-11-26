# CampusCare — Smart Campus Issue Tracker

A small, responsive campus issue tracking app built for the IT HAPPENS @ RAALE #15 Smart Campus & Lab Resource Issue Tracker challenge.

## What is included

- Reporter flow to create a ticket with title, description, category, priority, location, department, and optional photo evidence.
- Similar open ticket warning for the same campus location, with a choice to inspect the matching ticket or submit a separate issue.
- Admin view with open and in-progress counts, resolved tickets, average resolution time, department and priority filters, and technician workload.
- Admin assignment of open tickets to a listed technician. Admins can return an active ticket to Open with a reason before reassigning it.
- Technician flow to start assigned work, add progress notes, and resolve a ticket only after entering resolution details.
- Append-only ticket activity history for creation, assignment, progress, return, and resolution.
- Responsive layout and seeded example tickets for a quick walkthrough.

## Run locally

This is a static HTML, CSS, and JavaScript demo with no install step. From this folder, start any local static file server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Demo walkthrough

1. Start as Admin to see campus metrics, workload, filters, and sample tickets.
2. Open `TKT-204` to assign it to a Technician.
3. Switch the profile menu to Technician, open the assigned ticket, start work, then add a resolution note and resolve it.
4. Switch to Reporter and submit a similar ticket at `CSE AI Lab · PC-12` to see the duplicate warning.
5. Use All tickets to filter by status, priority, department, or search terms.

## Demo data and limitations

Tickets are saved in the current browser's local storage, so this demo has no shared database or real campus sign-in. The Admin, Technician, and Reporter selector is for presenting the workflows; permissions and validation run in the browser and are not a security boundary. Photo selection is validated and its filename is kept, but the image itself is not uploaded. For real campus use, connect an authenticated backend and shared database, enforce role permissions on the server, and store photo files in protected storage.

The resolution time metric is the arithmetic mean of `resolvedAt - createdAt` for resolved tickets. The demo records the resolution timestamp as the ticket's final update time.

## Deploy on Vercel

Import `Roshan-859/IT_Happens` as a new Vercel project. Select **Other** as the framework preset and leave the build command and output directory blank. The static files are served from the repository root. Vercel will provide a public preview URL when the deployment completes.

## Project files

- `index.html` — app layout and forms
- `styles.css` — responsive visual design
- `app.js` — ticket data, demo workflows, filters, validation, and history
