const medecinSchema = new mongoose.Schema({
    specialite: { type: String },
    numIdentification: { type: String, unique: true },
    adressePro: { type: String },
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
});

const Medecin = User.discriminator('Médecin', medecinSchema);
export default Medecin;
