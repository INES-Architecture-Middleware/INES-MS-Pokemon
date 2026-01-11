const authenticate = (req, res, next) => {
    const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "internal_secret";

    const secret = req?.header("x-internal-secret");

    if (secret) {
        if(secret === INTERNAL_SECRET) {
            // req.user = user;
            next();
        }else res.sendStatus(401)
    } else {
        res.sendStatus(401);
    }
}

const requestDetails = (req, res, next) => {
  const today = new Date()
  console.log(req.method + ' - ' + ("/pokemon" + req.url) + ' - ' + today.toLocaleString())
  next()
}

module.exports = {authenticate, requestDetails}