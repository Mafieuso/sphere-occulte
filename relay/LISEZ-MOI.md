# Relais Discord (gratuit) — mise en place

Le webhook Discord ne doit **jamais** être dans le code, ni dans la base : Discord supprime
automatiquement les webhooks publiés sur GitHub, et tout membre pourrait le copier.

1. https://script.google.com → nouveau projet → coller `discord-relay.gs` → enregistrer.
2. **Paramètres du projet → Propriétés du script → Ajouter** : `DISCORD_WEBHOOK` = l'URL du webhook.
3. **Déployer → Nouveau déploiement → Application Web** : *Exécuter en tant que : Moi* ; *Accès : Tout le monde* → autoriser → copier l'URL `…/exec`.
4. Sur le site : Admin → Accès & Comptes → « Relais Discord des rapports » → coller l'URL `…/exec` → Enregistrer.

Le relais vérifie le jeton Firebase de l'envoyeur et son rôle (admin / haut_grade), limite la
cadence (30 envois / 10 min / personne) et n'autorise que les mentions des 2 rôles prévus.
Après modification du script : Déployer → Gérer les déploiements → Modifier → Nouvelle version.
