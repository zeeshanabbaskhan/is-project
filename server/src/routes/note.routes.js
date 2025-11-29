import express from 'express';
import { authenticate, logAccess } from '../middleware/index.js';
import { noteController } from '../controllers/index.js';

const router = express.Router();

// POST /api/notes - Create a new secure note
router.post('/', authenticate, logAccess('note_create', 'note'), noteController.createNote);

// GET /api/notes - Get user's notes
router.get('/', authenticate, noteController.getNotes);

// GET /api/notes/:id - Get and decrypt a specific note
router.get('/:id', authenticate, logAccess('note_view', 'note'), noteController.getNote);

// PUT /api/notes/:id - Update a note
router.put('/:id', authenticate, logAccess('note_update', 'note'), noteController.updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', authenticate, logAccess('note_delete', 'note'), noteController.deleteNote);

// POST /api/notes/:id/share - Share a note with another user
router.post('/:id/share', authenticate, logAccess('note_share', 'note'), noteController.shareNote);

export default router;
