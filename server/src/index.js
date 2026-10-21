// server/src/index.js
//
// index.js now only handles process startup.
//  It now only imports app.js and starts the listener.

import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Inkwell API listening on port ${PORT}`);
});