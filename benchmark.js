const fs = require("fs");
const { promisify } = require("util");
const { exec } = require("child_process");

const writeFileAsync = promisify(fs.writeFile);

async function getPackageManagerVersion(packageManager) {
    return new Promise((resolve, reject) => {
        const command = `${packageManager} --version`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error getting ${packageManager} version: ${stderr}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

async function runBenchmark(packageManager, packages) {
    console.log(`Started Benchmarking ${packageManager}...`);

    const packageManagerVersion = await getPackageManagerVersion(packageManager);

    console.log(`${packageManager} version: ${packageManagerVersion}`);

    const installCommand = packageManager === "yarn" ? "add" : "install";

    const results = [];

    for (const pkg of packages) {
        const startTime = Date.now();

        await new Promise((resolve, reject) => {
            const command = `${packageManager} ${installCommand} ${pkg}`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error installing ${pkg} using ${packageManager}: ${stderr}`);
                } else {
                    const endTime = Date.now();
                    const elapsedTime = endTime - startTime;

                    console.log(`${pkg} (${packageManager}): ${elapsedTime}ms`);

                    results.push({
                        package: pkg,
                        manager: packageManager,
                        manager_version: packageManagerVersion,
                        time: elapsedTime,
                    });

                    resolve();
                }
            });
        });
    }

    console.log(`Benchmark for ${packageManager} complete.\n`);

    return results;
}

async function main() {
    const packagesToInstall = ["next", "react", "pm2-windows-boot"];

    let npmResults, yarnResults

    try {
        // Run benchmarks for npm and yarn
        npmResults = await runBenchmark("npm", packagesToInstall);
        yarnResults = await runBenchmark("yarn", packagesToInstall);
    } catch (error) {
        console.log(error)
    }

    const allResults = (npmResults || []).concat(yarnResults || []);
    await writeFileAsync(
        "benchmark_results.json",
        JSON.stringify(allResults, null, 2)
    );

    console.log("Results saved to benchmark_results.json");
}

main();
