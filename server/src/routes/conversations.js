import { Router } from 'express';
import * as c from '../controllers/conversations.js';

const router = Router();
router.get('/', c.list);
router.post('/chat', c.chat);
router.get('/:id', c.getOne);
router.delete('/:id', c.remove);
export default router;