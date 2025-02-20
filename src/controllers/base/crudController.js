import { model } from 'mongoose';
import { Error as MongooseError } from 'mongoose';
import redisService from '../services/cache/redisService.js';

class CrudController {
    constructor(model) {
        this.model = model;
        this.cacheExpiration = 3600; // 1 heure en secondes
        this.modelName = model.modelName.toLowerCase();
    }

    // Clé de cache pour un élément individuel
    #getItemCacheKey(id) {
        return `${this.modelName}:${id}`;
    }

    // Clé de cache pour la liste complète
    #getListCacheKey() {
        return `${this.modelName}:all`;
    }

    async create(req, res) {
        try {
            const newItem = await this.model.create(req.body);
            
            // Invalider le cache de la liste après création
            await redisService.del(this.#getListCacheKey());
            
            return res.status(201).json(newItem);
        } catch (error) {
            return this.#handleError(res, error, 'Erreur lors de la création de l\'élément');
        }
    }

    async read(req, res) {
        try {
            const cacheKey = this.#getItemCacheKey(req.params.id);
            
            // Vérifier le cache Redis en premier
            const cachedItem = await redisService.get(cacheKey);
            if (cachedItem) {
                return res.status(200).json(cachedItem);
            }
            
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ 
                    message: 'Élément non trouvé',
                    details: `Aucun élément correspondant à l'ID ${req.params.id}`
                });
            }
            
            // Mettre en cache avec expiration
            await redisService.set(cacheKey, item, this.cacheExpiration);
            
            return res.status(200).json(item);
        } catch (error) {
            return this.#handleError(res, error, 'Erreur lors de la récupération de l\'élément');
        }
    }

    async update(req, res) {
        try {
            const updatedItem = await this.model.findByIdAndUpdate(
                req.params.id,
                req.body,
                { 
                    new: true,
                    runValidators: true,
                    context: 'query'
                }
            );
            
            if (!updatedItem) {
                return res.status(404).json({ 
                    message: 'Élément introuvable pour mise à jour',
                    details: `Impossible de trouver l'élément avec l'ID ${req.params.id}`
                });
            }
            
            // Invalider le cache de l'élément et de la liste
            await Promise.all([
                redisService.del(this.#getItemCacheKey(req.params.id)),
                redisService.del(this.#getListCacheKey())
            ]);
            
            return res.status(200).json(updatedItem);
        } catch (error) {
            return this.#handleError(res, error, 'Erreur lors de la mise à jour de l\'élément');
        }
    }

    async delete(req, res) {
        try {
            const deletedItem = await this.model.findByIdAndDelete(req.params.id);
            if (!deletedItem) {
                return res.status(404).json({ 
                    message: 'Élément introuvable pour suppression',
                    details: `Aucun élément existant avec l'ID ${req.params.id}`
                });
            }
            
            // Invalider le cache de l'élément et de la liste
            await Promise.all([
                redisService.del(this.#getItemCacheKey(req.params.id)),
                redisService.del(this.#getListCacheKey())
            ]);
            
            return res.status(204).send();
        } catch (error) {
            return this.#handleError(res, error, 'Erreur lors de la suppression de l\'élément');
        }
    }

    async list(req, res) {
        try {
            const cacheKey = this.#getListCacheKey();
            
            // Vérifier le cache Redis en premier
            const cachedList = await redisService.get(cacheKey);
            if (cachedList) {
                return res.status(200).json({
                    source: 'cache',
                    count: cachedList.length,
                    elements: cachedList
                });
            }
            
            const items = await this.model.find({});
            
            // Mettre en cache avec expiration
            await redisService.set(cacheKey, items, this.cacheExpiration);
            
            return res.status(200).json({
                source: 'database',
                count: items.length,
                elements: items
            });
        } catch (error) {
            return this.#handleError(res, error, 'Erreur lors de la récupération des éléments');
        }
    }
}

export default CrudController;