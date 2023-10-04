import { NS } from "@ns";


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
        else difficulty = ns.formulas.hacking.weakenTime(server, ns.getPlayer()) / ns.formulas.hacking.hackChance(server, ns.getPlayer());
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
    const [gThreads, wThreads] = getPrepInfo(ns, hostname);

}

/**
 * Get the amount of grow and weaken threads needed to bring a server to maximum money and minimum security.
 * @remarks This function requires 'Formulas.exe' to be present on your home server
 * @param ns The ns interface
 * @param server Hostname of the server you want to prep
 * @returns 2 element array containing the required amount of grow and weaken threads.
 */
function getPrepInfo(ns: NS, hostname: string): number[] {
    const sInfo = ns.getServer(hostname);
    const [curMoney, maxMoney] = [sInfo.moneyAvailable, sInfo.moneyMax];
    const multiplier = maxMoney / curMoney;

    const gThreads = ns.growthAnalyze(hostname, multiplier, 1);

    const secIncrease = Math.min(100 - ns.gethostnameSecurityLevel(hostname), ns.growthAnalyzeSecurity(gThreads, hostname, 1));
    const wThreads = Math.ceil(secIncrease / ns.weakenAnalyze(1,hostname,1));
    return [gThreads, wThreads];
}
//-----------------------------------------OTHER----------------------------------------------------------------------------
export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL'); ns.tail(); ns.clearLog();
    ns.print(getServerList(ns));
    ns.print(getServerList(ns).size);
}
