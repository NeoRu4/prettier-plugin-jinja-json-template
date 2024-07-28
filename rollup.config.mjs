// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
import copy from "rollup-plugin-copy";


const updatePackageJsonForDist = (content) => {
	const pkg = JSON.parse(content)
	pkg.scripts = undefined
	pkg.devDependencies = undefined

	return JSON.stringify(pkg, null, 2);
}

export default [
	{
		input: pkg.source,
		output: [
			{
				file: pkg.main,
				format: "cjs",
				sourcemap: true

			},
			{
				file: pkg.module,
				format: "esm",
				sourcemap: true
			}
		],
		plugins: [
			typescript(),
			copy({
				targets: [
					{ src: "README.md", dest: "dist/" },
					{ src:  "package.json", transform: updatePackageJsonForDist, dest: "dist/" }
				]
			})
		]

	},
	{
		input: pkg.source,
		output: {
			file: pkg.types,
			format: "esm"

		},
		plugins: [dts()]
	}
];

