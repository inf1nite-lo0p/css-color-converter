import * as path from "node:path";

const mocha = new (require("mocha"))({
    ui: "bdd",
    color: true,
});

mocha.addFile(path.resolve(__dirname, "./suite/convertText.test.js"));

mocha.run((failures: number) => {
    process.exitCode = failures ? 1 : 0;
});
