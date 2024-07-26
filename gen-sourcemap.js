var fs = require("fs");
var proc = require('child_process');

const fileParts = __filename.split("\\");
const currentFilename = fileParts[fileParts.length - 1];

fs.rmdirSync("dist", { recursive: true, force: true }, (err) => console.log(err));
fs.mkdirSync("dist");
console.log();
fs.readdir(".", { withFileTypes: true }, function(err, files) {

	var filtered = files.filter(dirent => dirent.isFile());
	filtered.forEach((f) => {
		var parts = f.name.split(".");
		var ext = parts[parts.length - 1];
		var filename = parts[0];
		if(ext === "js" && f.name !== currentFilename) {
			proc.exec(`uglifyjs ${f.name} -o dist/${filename}.min.js --source-map`);
		}
	})
});
