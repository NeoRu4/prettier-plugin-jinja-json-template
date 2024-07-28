import semver from "semver";

import fetch from "node-fetch";
import { ERROR, execCommand, exit, getPackage, SUCCESS, log, logError } from "./utils";

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
		logError(`version '${version}' have package on npm: `);

		return exit(ERROR);
	}

	const publish = () => log(execCommand(`npm publish ./dist/ --access public`));

	if (semver.prerelease(version)) {
		log(`❗❗️Version of package is on prerelease: ${version}`);
		publish();

		return exit(SUCCESS);
	}

	publish();

}


// Create a git tag
function createGitTag(version) {
	const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
	const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
	const GITHUB_ACTOR = process.env.GITHUB_ACTOR;

	if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_ACTOR) {
		logError(
			"One or more required environment variables are not set (GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ACTOR)"
		);
		return exit(ERROR);
	}

	log(execCommand(`git tag v${version}`));
	log(execCommand(
		`git push https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git --tags`
	));
}


const getReleaseText = (version) => `Release of version ${version}\n\`npm i -D prettier-plugin-jinja-json-template@${version}\`\n\`yarn add -D prettier-plugin-jinja-json-template@${version}\``
// Create a GitHub release
async function createGitHubRelease(version) {
	const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
	const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

	if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
		logError(
			"One or more required environment variables are not set (GITHUB_TOKEN, GITHUB_REPOSITORY)"
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
		logError(`Failed to create GitHub release: ${response.statusText}`);
		return exit(ERROR);
	}

	log(`GitHub release for version ${version} created successfully.`);
}

// Main function to run the release steps
async function release() {
	try {
		const version = packageJson.version;
		publishPackage(version);
		createGitTag(version);
		await createGitHubRelease(version);
	} catch (error) {
		logError(`exit with error '${error.message}'`);
		exit(ERROR);
	}
}

release();
