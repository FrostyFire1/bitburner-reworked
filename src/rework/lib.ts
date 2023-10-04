import { NS } from "@ns";
const HACK_PATH = "rework/payload/hack.js"
const GROW_PATH = "rework/payload/grow.js"
const WEAKEN_PATH = "rework/payload/weaken.js"

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
 * @param ns The ns interface
 * @param hostname Hostname of the server you want to prep
 */
export function prepServer(ns: NS, hostname: string) {
    const prepInfo = getPrepInfo(ns, hostname);
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
    ns.print(`${server.hackDifficulty} <- ${server.minDifficulty}`);
    const gThreads = f.hacking.growThreads(server, player, server.moneyMax, 1);
    server.hackDifficulty = Math.min(server.hackDifficulty + ns.growthAnalyzeSecurity(gThreads, hostname, 1), 100);

    const postWThreads = Math.ceil((server.hackDifficulty - server.minDifficulty) / SEC_DEC);

    return {
        preWThreads,
        gThreads,
        postWThreads,
    }

}
//-----------------------------------------OTHER----------------------------------------------------------------------------
export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL'); ns.tail(); ns.clearLog();
    ns.print(getServerList(ns));
    ns.print(getServerList(ns).size);
}
