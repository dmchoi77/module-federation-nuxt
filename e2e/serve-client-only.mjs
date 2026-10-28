import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import {
  createNuxtFixture,
  nuxtCliPath,
  waitForResponse,
} from "../test/helpers/release.mjs";

const remotePort = 4182;
const hostPort = 4181;
const remoteEntry = `http://127.0.0.1:${remotePort}/mf-manifest.json`;

let remoteRoot;
let hostRoot;
let remoteServer;
let hostServer;
let stopping = false;

function run(command, args, cwd) {
  return new Promise((resolveExit, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        NODE_OPTIONS: [process.env.NODE_OPTIONS, "--dns-result-order=ipv4first"]
          .filter(Boolean)
          .join(" "),
      },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveExit();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

function startServer(root, port) {
  return spawn(process.execPath, [join(root, ".output/server/index.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      NODE_OPTIONS: [process.env.NODE_OPTIONS, "--dns-result-order=ipv4first"]
        .filter(Boolean)
        .join(" "),
      PORT: String(port),
    },
    stdio: "inherit",
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolveExit) => child.once("exit", resolveExit));
}

async function cleanup() {
  if (stopping) return;
  stopping = true;
  await Promise.all([stopServer(hostServer), stopServer(remoteServer)]);
  await Promise.all([
    remoteRoot && rm(remoteRoot, { recursive: true, force: true }),
    hostRoot && rm(hostRoot, { recursive: true, force: true }),
  ]);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await cleanup();
    process.exit(0);
  });
}

try {
  remoteRoot = await createNuxtFixture("remote", {
    ssr: false,
    devServer: { port: remotePort },
    moduleFederation: {
      ssr: false,
      config: { name: "remote" },
    },
  });
  hostRoot = await createNuxtFixture("host", {
    ssr: false,
    devServer: { port: hostPort },
    moduleFederation: {
      ssr: false,
      config: {
        name: "host",
        hostInitInjectLocation: "entry",
        remotes: {
          remote: {
            type: "module",
            name: "remote",
            entry: remoteEntry,
          },
        },
      },
    },
  });

  await writeFile(
    resolve(remoteRoot, "app/components/exposed/Widget.vue"),
    '<template><h1 data-testid="remote-widget">dashboard</h1></template>\n',
  );
  await mkdir(resolve(hostRoot, "app/pages"), { recursive: true });
  await writeFile(
    resolve(hostRoot, "app/app.vue"),
    "<template><NuxtPage /></template>\n",
  );
  await writeFile(
    resolve(hostRoot, "app/pages/index.vue"),
    '<template><NuxtLink to="/dashboard">Dashboard</NuxtLink></template>\n',
  );
  await writeFile(
    resolve(hostRoot, "app/pages/dashboard.vue"),
    "<template><RemoteWidget /></template>\n",
  );

  await run(
    process.execPath,
    [nuxtCliPath("remote"), "build", remoteRoot],
    remoteRoot,
  );
  remoteServer = startServer(remoteRoot, remotePort);
  await waitForResponse(
    remoteEntry,
    remoteServer,
    ({ status }) => status === 200,
  );

  await run(
    process.execPath,
    [nuxtCliPath("host"), "build", hostRoot],
    hostRoot,
  );
  hostServer = startServer(hostRoot, hostPort);
  await waitForResponse(`http://127.0.0.1:${hostPort}/`, hostServer);
} catch (error) {
  await cleanup();
  throw error;
}

await new Promise(() => {});
