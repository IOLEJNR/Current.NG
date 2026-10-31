# Current.NG

A static demo for Nigerian community power updates, complaint moderation, provider matching, and generator fuel planning.

## Run locally

From the project folder, start a static server:

```powershell
python -m http.server 8080
```



## Demo accounts

- User: `user@current.ng` / `User123!`
- Admin: `admin@current.ng` / `Admin123!`

Browser local storage stores demo accounts, location data, and complaint records. This is a front-end prototype, not production authentication or moderation.

## Project structure

```text
.
├── login.html
├── index.html
├── admin-index.html
├── app.js
└── styles.css
```

Location matching requires browser permission and is approximate. Production deployment should use HTTPS and a real backend for authentication, storage, authorization, and provider data.
