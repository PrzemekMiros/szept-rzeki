# Szept Rzeki

Strona Astro z Tailwind CSS. Wymaga Node.js zgodnego z `engines` w `package.json`; workflow korzysta z Node.js 24.

## Praca lokalna

```sh
npm ci
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

## Budowanie

```sh
npm run build
```

Gotowa strona znajduje się w `dist/`. Nie należy publikować katalogu `src/` jako gotowej strony.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` instaluje zależności, buduje Astro, przesyła `dist/` i wdraża go do GitHub Pages po pushu na `main`. Można go też uruchomić ręcznie w zakładce Actions.

1. W repozytorium otwórz **Settings → Pages → Build and deployment**.
2. Ustaw **Source: GitHub Actions**, zamiast **Deploy from a branch**.
3. Wyślij kod strony, `package-lock.json`, konfigurację Astro oraz `.github/workflows/deploy.yml` do repozytorium. Sam lokalny plik workflow nie uruchamia GitHub Actions.
4. Sprawdź przebieg **Deploy Astro to GitHub Pages**. Nie uruchamiaj ponownie starego przebiegu **pages build and deployment**, który korzystał z Jekylla.

Domena `przystan-szept-rzeki.pl` jest ustawiona jako `site` w `astro.config.mjs` oraz w `public/CNAME` (Astro kopiuje ten plik do `dist/`). Ustawienie domeny w GitHub Pages i rekordy DNS muszą odpowiadać tej domenie. Nie dodajemy `base: '/szept-rzeki'`, ponieważ strona korzysta z własnej domeny.

Plik `public/.nojekyll` oznacza wynik jako gotową stronę statyczną, ale nie zastępuje budowania Astro ani ustawienia źródła na GitHub Actions.

## Zawartość pokazowa

Kalendarz tworzy lokalny plan wizyty; nie potwierdza dostępności, nie wysyła rezerwacji i nie pobiera płatności. Dane przystani, oferta i opinie wymagają potwierdzenia przed uruchomieniem usług.
