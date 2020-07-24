const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
    let options = {
        root: path.join(process.env.INIT_CWD, 'src', 'front-angular')
    }
    return res.sendFile('index.html', options);
});

module.exports = router;