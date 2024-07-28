import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export const SUCCESS = 0;
export const ERROR = 1;

export const exit = (code) => {
	process.exit(code);
};

export const log =
(data) => {
	console.log(data);
};
export const logError=
(data) => {
	console.log(`error: ${data}`);
};

export const execCommand = (command, env = { errorMessage: true }) => {
	try {
		return execSync(command, {
			stdio: "pipe",
			env: { ...process.env, ...env }
		})?.toString();
	} catch (error) {
		if (env.errorMessage) {
			logError(error.message ?? `Error: failed to execute command: ${command}`);
		}
		throw error;
	}
};

export const getPackage = () => {
	const packageJsonPath = path.join(process.cwd(), "package.json");
	return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
};

