import { NS } from "@ns";
const DIR = "scripts/payload"
const HACK_PATH = DIR+"/hack.js"
const GROW_PATH = DIR+"/grow.js"
const WEAKEN_PATH = DIR+"/weaken.js"

export function getServerList(ns: NS): string[] {
    let servers = new Set(ns.scan("home"));
    servers.forEach(server => {
        ns.scan(server).forEach(result => servers.add(result))
    });
    return Array.from(servers);
}
//-----------------------------------------BATCH RELATED FUNCTIONS----------------------------------------------------------------------------
/**
 * Calculates the batch potential of a server. Higher batch potential means the server is a better target.
 * @param ns The ns interface
 * @param target hostname of the target server
 * @returns The batch potential of the server.
 */
export function batchPotential(ns: NS, target: string): number {
    let server = ns.getServer(target);
    server.hackDifficulty = server.minDifficulty;
    let difficulty = server.hackDifficulty;
    if(ns.fileExists('Formulas.exe')){
        difficulty = ns.formulas.hacking.weakenTime(server, ns.getPlayer()) / ns.formulas.hacking.hackChance(server, ns.getPlayer());
    }
    else if(server.requiredHackingSkill > ns.getHackingLevel() / 2) return 0;
    return server.moneyMax / difficulty;
}


export function isPrepped(ns: NS, server: string): boolean{
    const info = ns.getServer(server);
    return info.moneyAvailable === info.moneyMax && info.hackDifficulty === info.minDifficulty;
}

/**
 * Brings the given server to maximum money and minimum security.
 * @remarks The function will continue distributing required threads until the server is successfully prepped. Because it uses getPrepInfo() you must own 'Formulas.exe' 
 * @param ns The ns interface
 * @param hostname Hostname of the server you want to prep
 */
export async function prepServer(ns: NS, hostname: string) {
    let prepInfo = getPrepInfo(ns, hostname);
    ns.print("INFO: PREPPING " +  hostname + " WITH " prepInfo);
    const delay = 25;
    const wTime = ns.getWeakenTime(hostname);
    const gTime = ns.getGrowTime(hostname);

    let threadsLeft = Object.values(prepInfo).reduce((a,b) => a+b,0);
    while(threadsLeft > 0){
        prepInfo.preWThreads = distribute(ns, WEAKEN_PATH, prepInfo.preWThreads, [hostname]);
        prepInfo.gThreads = distribute(ns, GROW_PATH, prepInfo.gThreads, [hostname, wTime-gTime+delay]);
        prepInfo.postWThreads = distribute(ns, WEAKEN_PATH, prepInfo.postWThreads, [hostname,delay*2]);

        threadsLeft = Object.values(prepInfo).reduce((a,b) => a+b,0);
        if(threadsLeft > 0) {
            prepInfo = getPrepInfo(ns, hostname);
            ns.print(`WARN: ${threadsLeft} THREADS REMAINING FOR ${hostname}. TRYING REMAINDER IN 10 SECONDS`);
            await ns.sleep(10*1000);
        }
    }

}

/**
 * Get the amount of grow and weaken threads needed to bring a server to maximum money and minimum security.
 * @remarks This function requires 'Formulas.exe' to be present on your home server
 * @param ns The ns interface
 * @param server Hostname of the server you want to prep
 * @returns Object containing the required threads.
 */
function getPrepInfo(ns: NS, hostname: string): object {
    const f = ns.formulas;
    const SEC_DEC = ns.weakenAnalyze(1,1);
    let server = ns.getServer(hostname);
    const player = ns.getPlayer();

    const preWThreads = Math.ceil((server.hackDifficulty - server.minDifficulty) / SEC_DEC);
    server.hackDifficulty = server.minDifficulty;

    const gThreads = f.hacking.growThreads(server, player, server.moneyMax, 1);
    server.hackDifficulty = Math.min(server.hackDifficulty + ns.growthAnalyzeSecurity(gThreads, hostname, 1), 100);

    const postWThreads = Math.ceil((server.hackDifficulty - server.minDifficulty) / SEC_DEC);

    return {
        preWThreads,
        gThreads,
        postWThreads,
    }

}

/**
 * Simulates a distribution or distributes a given script across all available servers up to the given amount of threads.
 * @param script Script to distribute  
 * @param threads Total amount of threads to distribute the script to
 * @param args Script arguments
 * @param simulate Optional. If set to true the distirbution will be simulated
 * @param useHome Optional. If set to false the home server will be ignored
 * @returns Number of threads the function couldn't distribute. If threads is 0 then all threads have been successfully distributed.
 */
export function distribute(ns: NS, script: string, threads: number, args, simulate = false, useHome = true): number{
    if(threads === 0) return 0;
    const scriptRam = ns.getScriptRam(script);
    let potentialServers = [...getServerList(ns), ...ns.getPurchasedServers()]
    .map(s => ns.getServer(s));

    const distributables = potentialServers
    .filter(s => s.hasAdminRights && s.maxRam > 0)

    for(let i = 0; i < distributables.length; i++){
        const server = distributables[i];
        if(threads === 0) break;
        if(server.hostname === "home" && !useHome) continue;

        const usableRam = server.maxRam - server.ramUsed;
        const usableThreads = Math.floor(usableRam / scriptRam);
        if (usableThreads === 0) continue;

        const threadCount = Math.min(usableThreads, threads);
        threads -= threadCount;

        if(simulate) {
            server.ramUsed += threadCount*scriptRam;
            if(server.maxRam - server.ramUsed < scriptRam){
                distributables.splice(i,1);
                i--;
            }
        }
        else{
            const pid = ns.exec(script, hostname, threadCount, ...args);
            if(pid == 0) ns.print(`ERROR: COULDN'T RUN ${script} ON ${hostname}`);
        }

    }
    return threads;
}
//-----------------------------------------OTHER----------------------------------------------------------------------------

export function movePayload(ns: NS, payload: string[]){
    let servers = [...getServerList(ns), ...ns.getPurchasedServers()];
    for(const server of servers){
        if(server === "home") continue;
        ns.scp(payload, server);
    }
}
export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL'); ns.tail(); ns.clearLog();
    ns.print(getServerList(ns));
    ns.print(getServerList(ns).size);
}
