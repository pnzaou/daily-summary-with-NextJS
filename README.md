This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tests

Les tests (`tests/`) appellent l'application lancée en local, comme le feraient l'admin, le comptable et les gérants : connexion, droits par rôle, écritures, règle d'un rapport par jour, pages.

**Ils effacent et remplissent la base désignée par `MONGODB_URI` dans `.env`** : ils refusent de tourner si le nom de la base ne contient pas « test », mais vérifiez toujours que `.env` pointe vers la base de test, jamais vers la production.

```bash
# terminal 1
npm run dev
# terminal 2
npm test
```

Par défaut les tests visent `http://localhost:3000` ; pour un autre port : `TEST_BASE_URL=http://localhost:3100 npm test`.

### Sur GitHub (CI)

`.github/workflows/ci.yml` lance le lint et le build, puis `npm test`, à chaque pull request vers `main` et à chaque push sur `main`. Pour les tests de bout en bout, il faut :

1. un secret **`MONGODB_URI_TEST`** (*Settings → Secrets and variables → Actions*) contenant l'URI de la **base de test** — idéalement avec un utilisateur MongoDB qui n'a accès qu'à cette base ;
2. que MongoDB Atlas accepte les connexions depuis GitHub Actions (*Network Access*), dont les adresses IP changent à chaque exécution.

Sans ce secret, le lint et le build tournent quand même ; seul le job de tests échoue en indiquant le secret manquant.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
