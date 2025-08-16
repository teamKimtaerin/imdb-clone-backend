exports.getAllUsers = (req, res) => {
    res.json([{ id: 1, name: 'Alice' }]);
};

exports.createUser = (req, res) => {
    const { name } = req.body;
    res.status(201).json({ id: Date.now(), name });
};
