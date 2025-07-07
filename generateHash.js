import bcrypt from 'bcryptjs';

const password = 'Passer@123!';

bcrypt.hash(password, 12)
  .then(hash => {
    console.log('Nouveau mot de passe:', password);
    console.log('Hash généré:', hash);
    console.log('\nCommande MongoDB pour mettre à jour:');
    console.log(`db.users.updateOne(
  { "_id": ObjectId("67c375f977605b1f774c91f3") },
  { "$set": { "motDePasse": "${hash}" } }
);`);
  })
  .catch(err => {
    console.error('Erreur:', err);
  }); 