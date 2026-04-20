# animesh.dev — personal portfolio

Static site. No build step. Pushed straight to GitHub Pages.

- `index.html` — landing (hero, work timeline, projects, about, contact)
- `projects/` — case-study pages
- `css/style.css` — styles
- `js/main.js` — nav shadow + reveal-on-scroll
- `assets/animesh-sinha-resume.pdf` — downloadable resume

Fonts: Fraunces (display) + Inter (body) + JetBrains Mono (mono).

## Local preview

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy

GitHub Pages, served from `main` at `/`. Auto-deploys on push.
