# Filet de sécurité

- Aucun push sans mon feu vert explicite.
- Push forcé seulement avec un bail sur un SHA exact : `--force-with-lease=<branche>:<sha>`.
- `git fetch` juste avant chaque push. Si la branche distante a bougé, s'arrêter et me le signaler.
- Secrets, jetons, mots de passe et adresses : jamais écrits dans le code, les tickets, les commits ou les messages. Je les saisis moi-même.
- Statut final d'un ticket (Fixed) seulement sur mon « oui » explicite, jamais d'initiative.
