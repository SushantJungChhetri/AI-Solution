import express from 'express';
import articlesRouter from './articles.js';
import eventsRouter from './events.js';
import galleriesRouter from './galleries.js';
import inquiriesRouter from './inquiries.js';
import feedbackRouter from './feedback.js';

const router = express.Router();

router.use('/articles', articlesRouter);
router.use('/events', eventsRouter);
router.use('/galleries', galleriesRouter);
router.use('/inquiries', inquiriesRouter);
router.use('/feedback', feedbackRouter);

export default router;
