# Déploiement en production (VPS OVH)

Contexte : déploiement production initial. Architecture : un seul VPS OVH,
Docker Compose avec trois services (`mysql`, `api`, `web`), `web` faisant à
la fois front statique et reverse proxy HTTPS (Caddy, certificats Let's
Encrypt automatiques). Utilisation de sslip.io en attendant l'achat d'un
nom de domaine dédié : ce service résout automatiquement
`<ip-avec-tirets>.sslip.io` vers l'IP du VPS et supporte des sous-domaines
arbitraires. Ce document explique aussi comment basculer vers un vrai domaine
le jour venu (section 10).

## Prérequis

- VPS OVH déjà commandé (gamme VPS-1 2027, datacenter Strasbourg, Ubuntu 26.04
  LTS, IP publique notée `<IP_VPS>` ci-dessous).
- Une paire de clés SSH sur ta machine. Si absente :
  ```powershell
  ssh-keygen -t ed25519
  ```

Dans tout ce document, remplacer :

- `<IP_VPS>` par l'IP publique réelle du VPS (format normal, avec des points).
- `<IP-VPS-AVEC-TIRETS>` par la même IP avec des tirets à la place des points
  (ex: `51.75.20.10` → `51-75-20-10`).

## 1. Connexion SSH initiale

```powershell
ssh root@<IP_VPS>
```

Mot de passe root fourni par OVH (email de commande ou panel OVH).

## 2. Ajouter ta clé SSH publique

Sur le VPS (une fois connecté) :

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "<contenu de ta clé publique, ex. le contenu de ~/.ssh/id_ed25519.pub>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Sans fermer cette session**, ouvrir un **nouveau** terminal et vérifier que
la connexion par clé fonctionne :

```powershell
ssh root@<IP_VPS>
```

Elle ne doit plus demander de mot de passe. Ne pas passer à l'étape suivante
tant que ce n'est pas confirmé dans ce second terminal.

## 3. Désactiver l'authentification par mot de passe SSH

⚠️ Uniquement après avoir confirmé l'étape 2 dans un terminal séparé encore
ouvert (garde-fou contre un verrouillage total du VPS).

Éditer `/etc/ssh/sshd_config` et mettre :

```
PasswordAuthentication no
```

Puis :

```bash
systemctl restart sshd
```

## 4. Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Sans les ports 80/443 ouverts, Caddy ne pourra jamais obtenir de certificat
Let's Encrypt (le défi de validation passe par ces ports).

## 5. Installer Docker + Docker Compose

```bash
curl -fsSL https://get.docker.com | sh
```

Le plugin `docker compose` (v2, commande `docker compose`, sans tiret) est
inclus par ce script.

## 6. Cloner le repo

```bash
git clone <url-du-repo> constemps
cd constemps
```

Si le repo est privé, utiliser un token d'accès personnel ou une clé de
déploiement (à générer côté GitHub/GitLab), passés au moment du clone.

## 7. Configurer le `.env` réel

```bash
cp .env.prod.example .env
nano .env
```

Remplacer dans `.env` :

- `<IP-VPS-AVEC-TIRETS>` dans `WEB_ORIGIN` **et** `VITE_API_URL` par l'IP
  réelle avec tirets (les deux, oublier `VITE_API_URL` fait échouer tous
  les appels du front avec `ERR_CONNECTION_REFUSED`).
- `JWT_SECRET` : valeur forte générée, ex. `openssl rand -base64 48`.
- `GEMINI_API_KEY` : la clé réelle.
- `MYSQL_PASSWORD` et `MYSQL_ROOT_PASSWORD` : mots de passe forts et distincts.
- `DATABASE_URL` : reporter la même valeur que `MYSQL_PASSWORD`.

Faire le même remplacement d'IP dans `apps/web/Caddyfile` (les deux blocs de
domaine, `app.` et `api.`).

## 8. Premier lancement

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d mysql
```

Attendre que MySQL soit `healthy` :

```bash
docker compose -f docker-compose.prod.yml ps
```

Puis lancer les migrations Prisma (avant de démarrer l'API) :

```bash
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

Et démarrer le reste :

```bash
docker compose -f docker-compose.prod.yml up -d
```

Si un build échoue, voir les logs détaillés :

```bash
docker compose -f docker-compose.prod.yml build api --progress=plain
```

## 9. Test de bout en bout

Sur `https://app.<IP-VPS-AVEC-TIRETS>.sslip.io` :

- Inscription puis connexion
- Création d'un deck
- Création d'une fiche puis review
- Génération de fiches par IA
- Installation en PWA (icône d'installation dans la barre d'adresse)

## 10. Bascule vers un vrai domaine (plus tard)

Une fois un nom de domaine acheté :

1. Créer un enregistrement DNS A pointant vers `<IP_VPS>`.
2. Remplacer les deux hosts `sslip.io` dans `apps/web/Caddyfile` par les
   sous-domaines du vrai domaine.
3. Remplacer `WEB_ORIGIN` dans `.env` par la nouvelle URL du front.
4. Remplacer `VITE_API_URL` dans `.env` par la nouvelle URL de l'API. Cette
   variable est figée dans le bundle front au moment du build (Vite ne la
   lit jamais au runtime dans le navigateur) : l'oublier reproduit
   exactement le bug rencontré au premier déploiement (front qui continue
   d'appeler l'ancienne URL, `ERR_CONNECTION_REFUSED`). Un `up -d` sans
   `--build` ne suffit pas, il faut bien reconstruire l'image `web`.
5. Reconstruire et relancer :
   ```bash
   git pull
   docker compose -f docker-compose.prod.yml up -d --build api web
   ```

Caddy demande alors automatiquement un nouveau certificat Let's Encrypt pour
le nouveau domaine. Les certificats sslip.io restent en cache dans le volume
`caddy_data` (inoffensif, juste inutilisés) plutôt que d'être régénérés à
chaque déploiement.

## Debug utile

```bash
docker compose -f docker-compose.prod.yml logs -f api    # ou web, mysql
docker compose -f docker-compose.prod.yml ps
```
