# Jonnalagadda Sai Amarthya — Portfolio

Personal portfolio. It opens on a Ferrari SF-23 in Charles Leclerc's No. 16 on the grid: five lights come on, they go out, and the car launches into the site.

Built with [Vite](https://vite.dev) and [three.js](https://threejs.org). No framework.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Build and preview the production version:

```bash
npm run build
npm run preview    # http://localhost:4173
```

The intro plays once per browser session. To see it again, use "Replay intro" in the footer or add `?intro` to the URL.
For tuning the animation, `?slowmo` plays it at quarter speed and `?at=5` freezes it at second 5.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On [vercel.com/new](https://vercel.com/new), import the repository. Vercel detects Vite on its own: the build command is `npm run build` and the output directory is `dist`.
3. Deploy.

## Project layout

```
index.html          page markup
src/main.js         sections, scroll effects, live GitHub line, clock
src/intro.js        the 3D opening sequence
src/xray.js         the x-ray car in Capabilities
src/data.js         projects, milestones, skills (edit content here)
src/style.css       all styling
public/models/      the compressed car model (3.1 MB)
public/work/        screenshots of the live projects
```

## Credits

The car is ["Scuderia Ferrari F1 SF23 2023"](https://sketchfab.com/3d-models/scuderia-ferrari-f1-sf23-2023-ecb0f812bc454331bbe721655b0780ec) by Redgrund, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Changes: the race number was repainted from 55 to 16, and the model was simplified and compressed (meshopt, WebP textures) for the web.

Ferrari, the Prancing Horse and sponsor marks belong to their owners. This is a personal, non-commercial fan tribute.
