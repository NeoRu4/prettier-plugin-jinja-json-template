// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
import copy from "rollup-plugin-copy";

const byDist = (file) => `dist/${file}`;

const updatePackageJsonForDist = (content) => {
	const pkg = JSON.parse(content);
	pkg.scripts = undefined;
	pkg.devDependencies = undefined;

	return JSON.stringify(pkg, null, 2);
};

const rollupOptions = [
	{
		input: pkg.source,
		output: [
			{
				file: byDist(pkg.main),
				format: "cjs",
				sourcemap: true
			},
			{
				file: byDist(pkg.module),
				format: "esm",
				sourcemap: true
			}
		],
		plugins: [
			typescript(),
			copy({
				targets: [
					{ src: "README.md", dest: byDist("") },
					{ src: "package.json", transform: updatePackageJsonForDist, dest: byDist("") }
				]
			})
		]
	},
	{
		input: pkg.source,
		output: {
			file: byDist(pkg.types),
			format: "esm"
		},
		plugins: [dts()]
	}
];

export default rollupOptions;
