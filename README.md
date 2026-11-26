# CampusCare · Smart Campus Mission Control

A responsive campus issue tracker and installable progressive web app for the IT HAPPENS @ RAALE #15 Smart Campus & Lab Resource Issue Tracker challenge.

## App and website

CampusCare runs as a website on laptop and mobile browsers. On supported browsers, choose **Install app** to add it to the desktop or phone app launcher. On iPhone/iPad, use the browser's **Add to Home Screen** option. The app shell is cached for offline opening; tickets remain in that browser's local storage and need a connection to sync between devices because this demo does not have a shared server.

## Demo sign-in

Choose a role on the sign-in page. Demo account details are shown there; the shared demo password is `campuscare-demo`.

| Role | Email |
| --- | --- |
| Admin | `admin@campuscare.demo` |
| Technician | `tech@campuscare.demo` |
| Teacher | `teacher@campuscare.demo` |
| Student / Reporter | `student@campuscare.demo` |

## Included workflows

- Admin mission control with open queue, resolution, average resolution time, SLA compliance, and breach indicators.
- Campus health matrix with clickable zone filters, category and priority charts, and technician workload.
- Responsive ticket queue with search, status, priority, and department filters.
- Reporter ticket creation with required details, optional image metadata, and similar-ticket warnings.
- Admin assignment and return-to-open workflow with a recorded reason.
- Technician start-work, progress note, and resolution note flow.
- Ticket history for creation, assignment, progress, return, and resolution.
- Role-based workspaces for admin, technician, teacher, and student/reporter.

## Run locally

This is a static HTML, CSS, and JavaScript app with no install step. From the project folder, start a static file server:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser. A secure origin such as localhost or HTTPS is needed for install prompts and service workers.

## Demo limitations

The sign-in screen and role selection are for demonstration. They do not authenticate a real campus account, and role checks run in the browser, so they are not a security boundary. Tickets are stored only in the current browser. Photo type and size are checked, but files are not uploaded. Before real use, connect a shared database and authentication provider, enforce permissions on the server, and store attachments in protected storage.

The demo's SLA target is four hours for Urgent, eight hours for High, 24 hours for Medium, and 72 hours for Low priority. Average resolution time is the mean of `resolvedAt - createdAt` for resolved tickets. The demo uses the ticket's final update time as the resolution time.

## Deploy on Vercel

The GitHub repository is connected to Vercel. Push commits to `main` to create a new production deployment. The project uses the **Other** framework preset and serves static files from the repository root.

## Project files

- `index.html` — mission-control dashboard, responsive sign-in, and ticket dialogs
- `styles.css` — laptop and mobile layouts
- `app.js` — sample accounts, ticket workflows, dashboard metrics, and role views
- `manifest.webmanifest` and `icon.svg` — installable app details
- `service-worker.js` — offline app-shell cache
