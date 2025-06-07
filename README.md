# S4_DACS_01_1_Solution_Deployment

Ce projet permet de collecter des enregistrement de phrases lues par les utilisateur.  
Il se compose de trois services conteneurisés :

- **backend** : API REST pour recevoir et stocker les fichiers audio  
- **mongo**  : base de données pour les métadonnées  
- **frontend** : interface web statique  

Pour l'utiliser il suffit d'appuyer sur le bouton commencer qui va ouvrir un formulaire demandant l'age, le genre, et d'accepter les conditions.

Ensuite s'ouvre une page pour démarrer un nouvel enregistrement, appuyer sur le bouton choisir le nombre de phrase(s) et commencer.

La première phrase s'affiche à l'écran, il faut s'enregistrer puis arreter l'enregistrement. Il y a la possibilité de l'écouter et de le réenregistrer s'il ne convient pas.

Ensuite pour la phrase suivante c'est pareil une fois arrivé au bout des phrases on revient à l'accueil, il y a cependant la possibilité de terminer la session avant la fin de toutes les phrases.