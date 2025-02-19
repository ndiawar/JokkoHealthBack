import Queue from 'bull';
import emailService from '../services/email/emailService.js';
import { REDIS_URL } from '../config/environment.js';

// Create a new queue for email processing
const emailQueue = new Queue('emailQueue', REDIS_URL);

// Process the email queue
emailQueue.process(async (job) => {
    const { emailData } = job.data;
    try {
        await emailService.sendEmail(emailData);
        console.log(`Email sent to ${emailData.to}`);
    } catch (error) {
        console.error(`Failed to send email to ${emailData.to}:`, error);
        throw error; // Re-throw the error to keep the job in the queue for retry
    }
});

// Function to add an email to the queue
export const addEmailToQueue = (emailData) => {
    return emailQueue.add({ emailData });
};
