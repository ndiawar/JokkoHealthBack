import { Error as MongooseError } from 'mongoose';

class CrudController {
    constructor(model) {
        this.model = model;
        this.cacheExpiration = 3600; // 1 heure en secondes, mais pourrait être dynamique
        this.modelName = model.modelName.toLowerCase();
    }

    // 🔹 Gestion des erreurs globales
    #handleError(res, error, message = 'Erreur serveur') {
        console.error(message, error);

        if (error instanceof MongooseError.ValidationError) {
            return res.status(400).json({ message: 'Validation échouée', details: error.errors });
        }
        if (error.code === 11000) { // Gestion des duplications (ex: email unique)
            return res.status(409).json({ message: 'Conflit de données', details: error.keyValue });
        }

        return res.status(500).json({ message, error: error.message });
    }

    // 🔹 Création d'un élément
    async create(req, res) {
        try {
            const newItem = await this.model.create(req.body);
            return res.status(201).json(newItem);
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la création de l'élément");
        }
    }

    // 🔹 Lecture d'un élément par ID
    async read(req, res) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Élément non trouvé' });
            }

            return res.status(200).json(item);
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la récupération de l'élément");
        }
    }

    // 🔹 Mise à jour d'un élément par ID
    async update(req, res) {
        try {
            // Liste des champs autorisés pour la mise à jour
            const allowedUpdates = ['nom', 'prenom', 'email', 'role', 'dateNaissance', 'sexe', 'telephone'];
    
            // Récupérer les clés des champs à mettre à jour depuis le corps de la requête
            const updates = Object.keys(req.body);
            
            // Vérifier si tous les champs à mettre à jour sont autorisés
            const isValidOperation = updates.every(update => allowedUpdates.includes(update));
            
            if (!isValidOperation) {
                return res.status(400).json({ message: 'Certains champs ne peuvent pas être mis à jour' });
            }
    
            // Si le mot de passe est dans la requête, il faudrait gérer le cas particulier
            if (req.body.motDePasse) {
                return res.status(400).json({ message: "Le mot de passe ne peut pas être mis à jour via cette méthode." });
            }
    
            // Mettre à jour l'utilisateur dans la base de données
            const updatedItem = await this.model.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true, context: 'query' }
            );
    
            if (!updatedItem) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }
    
            return res.status(200).json(updatedItem);
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la mise à jour de l'utilisateur");
        }
    }
    

    // 🔹 Suppression d'un élément par ID
    async delete(req, res) {
        try {
            const itemId = req.params.id;

            // Vérifier si l'ID est valide
            if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ message: "ID invalide" });
            }

            // Vérifier si l'élément existe
            const existingItem = await this.model.findById(itemId);
            if (!existingItem) {
                return res.status(404).json({ message: "Élément introuvable pour suppression" });
            }

            // Supprimer l'élément
            await this.model.findByIdAndDelete(itemId);

            return res.status(200).json({ 
                message: "Élément supprimé avec succès", 
                deletedItem: existingItem 
            });

        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            return res.status(500).json({ error: "Erreur serveur lors de la suppression de l'élément" });
        }
    }

    // 🔹 Récupération de tous les éléments
    async list(req, res) {
        try {
            const items = await this.model.find({});
            return res.status(200).json({
                count: items.length,
                elements: items
            });
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la récupération des éléments");
        }
    }
}

export default CrudController;