const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const validate = require('../middleware/validate');
const { employeeCreateSchema, employeeUpdateSchema } = require('../validators/employeeValidator');

// Dropdown options (must precede /:id)
router.get('/options', (req, res, next) => employeeController.getOptions(req, res, next));
router.get('/export/csv', (req, res, next) => employeeController.exportCsv(req, res, next));

// Employee CRUD
router.get('/', (req, res, next) => employeeController.list(req, res, next));
router.post('/', validate(employeeCreateSchema), (req, res, next) => employeeController.create(req, res, next));
router.get('/:id', (req, res, next) => employeeController.getById(req, res, next));
router.put('/:id', validate(employeeUpdateSchema), (req, res, next) => employeeController.update(req, res, next));
router.delete('/:id', (req, res, next) => employeeController.delete(req, res, next));

module.exports = router;
