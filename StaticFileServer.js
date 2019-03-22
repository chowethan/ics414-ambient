const fs = require('fs');

function run(application, Directory) {
	application.use(async (request, response, next) => {
		let path = request.path;
		// Removes the leading slash
		let internalPath = Directory.STATIC + path.substring('/'.length);

		if (path.charAt(path.length - 1) == '/') {
			// Try to route to an index if the request is for a directory
			internalPath += 'index';
		}

		// Look for a file with the same path but with the .html extension appended
		// This allows /test to point to /test.html
		fs.access(internalPath + '.html', fs.constants.R_OK, (error) => {
			if (error) {
				// Look for the explicit file
				fs.access(internalPath, fs.constants.R_OK, (error) => {
					if (error) {
						let httpError = new Error('404 Not Found');
						httpError.status = 404;

						// Trigger the error handler chain
						next(httpError);

						return;
					}

					let redirect = undefined;

					// Redirect any relative /index.html to just the relative /
					// Redirect any .html file to the URL without the extension
					if (path.substring(path.length - '/index.html'.length) == '/index.html') {
						redirect = path.substring(0, path.length - 'index.html'.length);
					} else if (path.substring(path.length - '.html'.length) == '.html') {
						redirect = path.substring(0, path.length - '.html'.length);
					}

					if (redirect !== undefined) {
						// Send a 301 Moved Permanently
						response.statusCode = 301;
						response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
						response.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
						response.setHeader('Location', redirect);
						response.send('');
					} else {
						// Send the file
						response.sendFile(internalPath);
					}
				});

				return;
			}

			let redirect = undefined;

			// Redirect any relative /index to just the relative /
			if (path.substring(path.length - '/index'.length) == '/index') {
				redirect = path.substring(0, path.length - 'index'.length);
			}

			if (redirect !== undefined) {
				// Send a 301 Moved Permanently
				response.statusCode = 301;
				response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
				response.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
				response.setHeader('Location', redirect);
				response.send('');
			} else {
				// Send the file
				response.sendFile(internalPath + '.html');
			}
		});
	});

	// Handle errors
	application.use(async (mainError, request, response, next) => {
		// Return the correct status code header
		response.statusCode = mainError.status

		// Send a plain text error
		response.setHeader('Content-Type', 'text/plain');
		response.send('');
	});
}

module.exports = run;
