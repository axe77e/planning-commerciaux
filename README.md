# Planning Commerciaux — Guide de déploiement

Ce dossier contient tout ce qu'il faut pour mettre ton planning en ligne, accessible à tes télépros depuis n'importe quel navigateur.

## Étape 1 — Créer un compte GitHub (si tu n'en as pas)

1. Va sur https://github.com
2. Clique "Sign up", crée ton compte (gratuit)

## Étape 2 — Créer un nouveau repository

1. Une fois connecté, clique le bouton vert "New" (ou le "+" en haut à droite → "New repository")
2. Donne-lui un nom, par exemple : `planning-commerciaux`
3. Laisse-le "Public" ou "Private" (peu importe pour la suite)
4. Ne cोche aucune case (pas de README, pas de .gitignore — on les a déjà)
5. Clique "Create repository"

## Étape 3 — Uploader les fichiers

1. Sur la page de ton nouveau repository vide, clique sur le lien "uploading an existing file"
2. Fais glisser **tous les fichiers et dossiers** de ce dossier `planning-app` dans la zone (garde la structure : `src/App.jsx`, `src/main.jsx`, `index.html`, `package.json`, `vite.config.js`, `.gitignore`)
3. En bas de la page, clique "Commit changes"

## Étape 4 — Déployer sur Vercel

1. Va sur https://vercel.com
2. Clique "Sign Up" et choisis "Continue with GitHub" (ça connecte directement ton compte)
3. Une fois connecté, clique "Add New..." → "Project"
4. Vercel affiche la liste de tes repositories GitHub : trouve `planning-commerciaux` et clique "Import"
5. Laisse tous les réglages par défaut (Vercel détecte automatiquement que c'est un projet Vite)
6. Clique "Deploy"
7. Attends 1-2 minutes — Vercel installe et construit le site automatiquement

## Étape 5 — Récupérer le lien

Une fois le déploiement terminé, Vercel affiche une URL du type :

```
https://planning-commerciaux-xxxx.vercel.app
```

C'est ce lien que tu partages à tes télépros. Ils peuvent l'ouvrir sur ordinateur, tablette ou téléphone.

## Mettre à jour le planning plus tard

Si tu reviens me voir pour ajouter des fonctionnalités :
1. Je te redonne un fichier `App.jsx` mis à jour
2. Tu vas sur ton repository GitHub → fichier `src/App.jsx` → bouton crayon (Edit) → tu remplaces tout le contenu → "Commit changes"
3. Vercel redéploie automatiquement en 1-2 minutes, le lien reste le même

## Important à savoir

⚠️ **Les données ne sont pas sauvegardées entre les sessions.** Si quelqu'un ferme l'onglet ou recharge la page, le planning repart à zéro. C'est le fonctionnement actuel de l'outil (pas de base de données connectée).

Si tu veux que les données soient **sauvegardées en permanence** et partagées en temps réel entre tous tes télépros (ce qui est probablement ce que tu veux pour un usage quotidien en équipe), il faudra qu'on ajoute une base de données — dis-le-moi quand tu en seras là, c'est une étape supplémentaire mais tout à fait faisable.
