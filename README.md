# 👑 Miss France 2027 PickEm

Mini app de pronostics entre amis pour l'élection du samedi 12 décembre 2026 (TF1).
Statique (HTML/CSS/JS), sans serveur ni compte, hébergée sur GitHub Pages.

👉 **https://bcottereau.github.io/PickEm_MissFrance/**

## Qui fait quoi

**Les joueurs** (n'importe qui ayant le lien) peuvent seulement :
- faire leur Top 12 : la Miss France, les 4 dauphines dans l'ordre, puis 7 autres ;
- consulter les fiches des candidates et le classement officiel ;
- copier leur lien de pronostic et l'envoyer à l'organisateur. Pour changer d'avis, il
  suffit de modifier son Top 12 et de renvoyer le nouveau lien : l'app indique si le
  classement n'est plus à jour.

Le site ne peut pas être modifié par les joueurs : toute écriture passe par GitHub et
exige le jeton de l'organisateur.

**L'organisateur** (onglet **Admin**, après connexion) :
- ajoute ou met à jour les joueurs en collant leurs liens, ou en ouvrant directement un
  lien reçu → `players.json` ;
- publie son propre pronostic depuis « Mon pronostic », et le republie après chaque
  modification ;
- ajoute ou change les photos des candidates (redimensionnées automatiquement) →
  `photos/` + `photo_url` dans `data/candidates_2027.json` ;
- saisit les résultats le soir de l'élection, au fur et à mesure → `results.json`.

Chaque modification est un commit dans le dépôt, visible par tous d'ici 1 à 2 minutes
(le temps que GitHub Pages republie). Le site relit le classement et les résultats
chaque minute.

## Se connecter comme organisateur

1. Créer un jeton sur https://github.com/settings/personal-access-tokens/new
   - Nom : « PickEm admin ». Expiration : après le 13 décembre.
   - Repository access : *Only select repositories* → `PickEm_MissFrance`.
   - Permissions → Repository → **Contents : Read and write** (rien d'autre).
2. Sur le site : lien « Espace organisateur » en bas de page (ou adresse `…/#admin`),
   coller le jeton.

Le jeton est enregistré uniquement dans le navigateur de l'appareil utilisé (à refaire sur
chaque appareil). « Se déconnecter » dans l'onglet Admin l'efface. En cas de perte d'un
appareil, révoquer le jeton sur GitHub.

## Barème

| | Points |
|---|---|
| Bonne Miss France | 10 |
| Dauphine au bon rang | 5 par dauphine |
| Candidate choisie en 6e-12e, qualifiée dans le Top 12 hors Top 5 | 2 |
| Candidate qualifiée dans le Top 12, mais pas au bon rang | 1 |

Maximum 44 pts. Égalité départagée par le nombre de pronostics exacts. Pendant la soirée,
les scores encore incertains sont suivis d'un « ? ».

## Structure

```
├── index.html
├── css/style.css
├── js/app.js          logique de l'app (barème en haut du fichier : SCORING)
├── js/github.js       écritures dans le dépôt (mode organisateur)
├── players.json       classement officiel : [{ name, code }]
├── results.json       résultats de l'élection
├── photos/            portraits des candidates
└── data/
    ├── candidates_2027.json
    ├── winners_1920_2026.json
    ├── recent_placements_2022_2026.json
    └── region_stats.json   (référence, non lu par l'app)
```

Le `code` d'un joueur est son Top 12 encodé (12 caractères, un par candidate : Miss,
D1 à D4, puis le reste), le même que dans son lien `#p=…&n=…`.

## Données à vérifier

- Mandy Goudal (37 ou 38 ans) et Juliette Gauthier (22 ou 23 ans) : les sources divergent.
- Languedoc : 3 titres = Languedoc-Roussillon 1929 et 1971 + Languedoc 2006
  (la fiche le précise). Tahiti reprend l'historique de la Polynésie française.

## Tester en local

```bash
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000 (ouvrir le fichier directement ne permet pas de lire les JSON).
