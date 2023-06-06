const router = express.Router()

const usersController = require('../controllers/users')

router.use('/', (req, res, next) => {
    console.log("Richiesta ricevuta ");
    next()
})
router.get('/', usersController.getHomepage)
router.get('/add', usersController.addUser)
router.get('/:userId', usersController.getUserById)

module.exports = router