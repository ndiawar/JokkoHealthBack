const patientSchema = new mongoose.Schema({
    adresse: 
        { 
            type: String 
        },
    historiqueMedical: 
        [{ 
            type: mongoose.Schema.Types.ObjectId, ref: 'DossierMedical' 
        }],
    capteurs: 
        [{ 
            type: mongoose.Schema.Types.ObjectId, ref: 'Capteur' 
        }]
});

const Patient = User.discriminator('Patient', patientSchema);
export default Patient;
