-- À lancer une fois dans le SQL Editor pour pré-remplir la matrice des risques.
insert into risks (risque, pole, g, p, plan_b, statut) values
('Retard de livraison du bloc balsa / mousse', 'Logistique', 4, 3, 'Stock de sécurité : 2 blocs commandés chez un second fournisseur ; maquette de repli en mousse déjà en atelier.', 'Prêt'),
('Casse du support d’aileron arrière au fraisage CNC 4 axes', 'Usinage', 5, 4, 'Brut de rechange par lot de 3 ; programme CN validé en simulation ; aileron de secours en résine 3D Tough.', 'Prêt'),
('Défaillance d’étanchéité de la cartouche CO₂', 'Assemblage', 5, 2, 'Joints toriques remplacés à chaque tir ; test d’étanchéité avant chaque passage ; chambre de rechange pré-montée.', 'Prêt'),
('Désistement du sponsor maillots à J-15', 'Partenariats', 3, 2, 'Devis de substitution auprès de 2 textiliers locaux ; tenues sérigraphiées en interne.', 'Prêt'),
('Masse sous le minimum de 50,00 g après peinture / vernis', 'Assemblage', 4, 4, 'Lest tungstène calibré (0,30 g) dans le nez ; pesée après chaque couche ; 2 passes de vernis maximum.', 'Déclenché'),
('Panne du PC / vidéoprojecteur lors de la soutenance', 'Communication', 2, 2, 'Portfolio sur 2 clés USB + PDF imprimé ; second ordinateur de secours câblé en HDMI.', 'Prêt');
