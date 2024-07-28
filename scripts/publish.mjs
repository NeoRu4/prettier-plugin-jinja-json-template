import semver from "semver";

import fetch from "node-fetch";
import { ERROR, execCommand, exit, getPackage, log, logError, SUCCESS } from "./utils";

const packageJson = getPackage();


const isHaveVersionOnNpm = (version) => {
	const name = packageJson.name;

	try {
		execCommand(`npm view ${name}@${version} --json`, { encoding: "utf-8", errorMessage: false });
		return true;
	} catch (error) {
		return false;
	}
};

// Publish the package to npm
function publishPackage(version) {

	if (isHaveVersionOnNpm(version)) {
		logError(`version '${version}' have package on npm.`);
		return
	}

	log(execCommand(`npm publish ./dist/ --access public`));
}


// Create a git tag
function createGitTag(version) {

	const tag = `v${version}`;

	log(execCommand(`git tag ${tag}`));
	log(execCommand(`git push origin ${tag}`));
}


const getReleaseText = (version) => `Release of version ${version}\n\`npm i -D prettier-plugin-jinja-json-template@${version}\`\n\`yarn add -D prettier-plugin-jinja-json-template@${version}\``;

// Create a GitHub release
async function createGitHubRelease(version) {
	const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
	const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

	if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
		logError(
			"one or more required environment variables are not set (GITHUB_TOKEN, GITHUB_REPOSITORY)"
		);
		return exit(ERROR);
	}

	const [owner, repo] = GITHUB_REPOSITORY.split("/");

	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/releases`,
		{
			method: "POST",
			headers: {
				Authorization: `token ${GITHUB_TOKEN}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				tag_name: `v${version}`,
				name: `v${version}`,
				body: getReleaseText(version),
				draft: false,
				prerelease: false
			})
		}
	);

	if (!response.ok) {
		logError(`failed to create GitHub release: ${response.statusText}`);
		return exit(ERROR);
	}

	log(`gitHub release for version ${version} created successfully.`);
}

// Main function to run the release steps
async function release() {
	try {
		const version = packageJson.version;
		publishPackage(version);

		if (semver.prerelease(version)) {
			log(`❗❗️Version of package is on prerelease: ${version}`);
			return exit(SUCCESS);
		}

		createGitTag(version);
		await createGitHubRelease(version);
	} catch (error) {
		logError(`exit with error '${error.message}'`);
		exit(ERROR);
	}
}

release();
