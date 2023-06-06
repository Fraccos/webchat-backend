module.exports = {
    getHomepage: (req, res) => {
        res.send("Homepage utenti")
    },

    addUser: (req, res) => {
        res.send("Utente aggiunto")
    },

    getUserById: (req, res) => {
        res.render('infoUser', {userId: req.params.userId})
    }
}