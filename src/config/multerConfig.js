import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Importez fs pour gérer les dossiers

// Chemin relatif vers le dossier 'public/uploads/profiles'
const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'profiles');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuration du stockage de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profiles'); // Définir le dossier de destination pour les images
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now(); // Crée un nom de fichier unique basé sur le timestamp
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

// Filtre des fichiers (assurez-vous que le fichier est bien une image)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(file.mimetype);
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image.'), false);
  }
};


// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // Limite de taille à 5 Mo
  }
});

export default upload;