const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const validate = require('../middleware/validate');
const {
  taskCreateSchema,
  taskUpdateSchema,
  taskStatusUpdateSchema
} = require('../validators/taskValidator');

// CSV export must be declared BEFORE /:id
router.get('/export/csv', (req, res, next) => taskController.exportCsv(req, res, next));

// Task CRUD
router.get('/', (req, res, next) => taskController.list(req, res, next));
router.post('/', validate(taskCreateSchema), (req, res, next) => taskController.create(req, res, next));
router.get('/:id', (req, res, next) => taskController.getById(req, res, next));
router.put('/:id', validate(taskUpdateSchema), (req, res, next) => taskController.update(req, res, next));
router.put('/:id/status', validate(taskStatusUpdateSchema), (req, res, next) => taskController.updateStatus(req, res, next));
router.delete('/:id', (req, res, next) => taskController.delete(req, res, next));

module.exports = router;
