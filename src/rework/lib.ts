import { NS } from "@ns";

export function getServerList(ns: NS): string[] {
    let servers = new Set(ns.scan("home"));
    servers.forEach(server => {
        ns.scan(server).forEach(result => servers.add(result))
    });
    return Array.from(servers);
}

export function batchPotential(ns: NS, target: string): number {
    let server = ns.getServer(target);
    server.hackDifficulty = server.minDifficulty;
    const maxMoney = server.moneyMax;
    let difficulty = server.hackDifficulty;
    if(ns.fileExists('Formulas.exe')){
        if (!server.hasAdminRights) difficulty = Infinity;
        else difficulty = ns.formulas.hacking.weakenTime(server, ns.getPlayer()) / ns.formulas.hacking.hackChance(server, ns.getPlayer());
    }
    else if(server.requiredHackingSkill > ns.getHackingLevel() / 2) return 0;
    return maxMoney / difficulty;
}


export function isPrepped(ns: NS, server: string): boolean{
    const info = ns.getServer(server);
    return info.moneyAvailable === info.moneyMax && info.hackDifficulty === info.minDifficulty;
}

export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL'); ns.tail(); ns.clearLog();
    ns.print(getServerList(ns));
    ns.print(getServerList(ns).size);
}
